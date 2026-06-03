const { Score, Attendee, Fellow, Sprint } = require('../models');

let activeQuizState = {
  active: false,
  state: 'LOBBY', // LOBBY, ACTIVE_QUESTION, ANSWER_REVEAL, FINISHED
  active_question_id: null,
  duration: 0,
  start_time: null
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Sync newly connected user with quiz state
    socket.emit('quizSync', activeQuizState);

    // Join a room for a specific sprint or global events
    socket.on('joinRoom', (room) => {
      socket.join(room);
    });

    // Handle score submission
    socket.on('submitScore', async (data) => {
      try {
        const { attendee_id, target_attendee_id, criterion_id, points } = data;
        
        const newScore = await Score.create({
          attendee_id,
          target_attendee_id,
          criterion_id,
          points
        });

        // Broadcast to all clients to update leaderboard or sprint state
        io.emit('scoreUpdated', newScore);
      } catch (err) {
        console.error('Error submitting score:', err);
        socket.emit('error', 'Failed to submit score');
      }
    });

    // Admin assigned fellows to a sprint
    socket.on('sprintAssigned', (sprint_id) => {
      io.emit('sprintAssigned', sprint_id);
    });

    // Admin unlocked a sprint
    socket.on('sprintUnlocked', (sprint_id) => {
      io.emit('sprintUnlocked', sprint_id);
    });

    // Admin unlocked the poll
    socket.on('pollUnlocked', () => {
      io.emit('pollUnlocked');
    });

    // --- KAHOOT QUIZ EVENTS ---
    socket.on('hostQuiz', () => {
      activeQuizState = { active: true, state: 'LOBBY', active_question_id: null, duration: 0, start_time: null };
      io.emit('quizStarted');
      io.emit('quizSync', activeQuizState);
    });

    socket.on('showQuizQuestion', ({ question_id, duration }) => {
      activeQuizState = { 
        active: true, 
        state: 'ACTIVE_QUESTION', 
        active_question_id: question_id, 
        duration, 
        start_time: Date.now() 
      };
      io.emit('quizSync', activeQuizState);
    });

    socket.on('revealQuizAnswer', () => {
      activeQuizState.state = 'ANSWER_REVEAL';
      io.emit('quizSync', activeQuizState);
    });

    socket.on('endQuiz', () => {
      activeQuizState.state = 'FINISHED';
      activeQuizState.active_question_id = null;
      io.emit('quizSync', activeQuizState);
    });
    // --------------------------

    // Admin started a timer
    socket.on('startTimer', ({ sprint_id, duration }) => {
      io.emit('timerStarted', { sprint_id, duration, timestamp: Date.now() });
    });

    // Admin fired an objection for Part B
    socket.on('fireObjection', ({ target_attendee_id, objection_text }) => {
      io.emit('objectionFired', { target_attendee_id, objection_text, timestamp: Date.now() });
    });

    // Fellow submitted defense
    socket.on('defenseSubmitted', (sprint_id) => {
      io.emit('sprintAssigned', sprint_id); // Re-trigger a fetch for everyone in the sprint
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
