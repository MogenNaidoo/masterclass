const express = require('express');
const router = express.Router();
const { Attendee, Sprint, Score, PollQuestion, PollResponse, SprintAssignment, AppSetting } = require('../models');

// Login / Register
router.post('/login', async (req, res) => {
  const { full_name, email } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const isAdmin = email.toLowerCase() === 'admin@antigravity.com';

    let attendee = await Attendee.findOne({ where: { email } });
    if (!attendee) {
      attendee = await Attendee.create({ full_name, email, is_admin: isAdmin });
    }
    res.json(attendee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sprints
router.get('/sprints', async (req, res) => {
  try {
    const sprints = await Sprint.findAll({ order: [['order', 'ASC']] });
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get criteria for a sprint
router.get('/sprints/:sprint_id/criteria', async (req, res) => {
  try {
    const { ScoreCriterion } = require('../models');
    const criteria = await ScoreCriterion.findAll({
      where: { sprint_id: req.params.sprint_id }
    });
    res.json(criteria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all non-admin attendees
router.get('/attendees', async (req, res) => {
  try {
    const attendees = await Attendee.findAll({ where: { is_admin: false } });
    res.json(attendees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assigned fellows for a sprint
router.get('/sprints/:sprint_id/fellows', async (req, res) => {
  try {
    const assignments = await SprintAssignment.findAll({
      where: { sprint_id: req.params.sprint_id },
      include: [{ model: Attendee }],
      order: [['order', 'ASC']]
    });
    const fellows = assignments.map(a => ({
      ...a.Attendee.toJSON(),
      scenario: a.scenario,
      defense_text: a.defense_text,
      is_completed: a.is_completed
    }));
    res.json(fellows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Poll Questions
router.get('/poll-questions', async (req, res) => {
  try {
    const questions = await PollQuestion.findAll({
      attributes: { exclude: ['correct_option'] } // don't send correct answers to client
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const attendees = await Attendee.findAll({ where: { is_admin: false } });
    const scores = await Score.findAll();
    const pollResponses = await PollResponse.findAll({ where: { is_correct: true } });

    res.json({ attendees, scores, pollResponses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Poll Response
router.post('/poll-response', async (req, res) => {
  const { attendee_id, question_id, chosen_option, time_taken_ms } = req.body;
  try {
    const question = await PollQuestion.findByPk(question_id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const is_correct = question.correct_option === chosen_option;
    
    // Kahoot-style scoring: max 1000, min 500 for a correct answer over 20s.
    let points = 0;
    if (is_correct) {
      const time = time_taken_ms || 20000;
      points = Math.max(500, Math.round(1000 * (1 - (time / 40000))));
    }

    const response = await PollResponse.create({
      attendee_id,
      question_id,
      chosen_option,
      is_correct,
      points
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Unlock Sprint
router.post('/admin/sprints/:sprint_id/unlock', async (req, res) => {
  const { sprint_id } = req.params;
  try {
    const sprint = await Sprint.findByPk(sprint_id);
    if (sprint) {
      sprint.is_locked = false;
      await sprint.save();
      res.json(sprint);
    } else {
      res.status(404).json({ error: 'Sprint not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Assign Fellows to a Sprint
router.post('/admin/sprints/:sprint_id/assign', async (req, res) => {
  const { sprint_id } = req.params;
  const { attendee_ids } = req.body; // array of IDs
  
  try {
    // Remove existing assignments for this sprint
    await SprintAssignment.destroy({ where: { sprint_id } });
    
    // Create new assignments
    const assignments = attendee_ids.map((attendee_id, index) => ({
      sprint_id,
      attendee_id,
      order: index
    }));
    await SprintAssignment.bulkCreate(assignments);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Set Scenario for a Fellow
router.put('/admin/sprints/:sprint_id/fellows/:attendee_id/scenario', async (req, res) => {
  try {
    const { sprint_id, attendee_id } = req.params;
    const { scenario } = req.body;
    const assignment = await SprintAssignment.findOne({ where: { sprint_id, attendee_id } });
    if (assignment) {
      assignment.scenario = scenario;
      await assignment.save();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Assignment not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fellow: Submit Defense Text
router.put('/sprints/:sprint_id/fellows/:attendee_id/defense', async (req, res) => {
  try {
    const { sprint_id, attendee_id } = req.params;
    const { defense_text } = req.body;
    const assignment = await SprintAssignment.findOne({ where: { sprint_id, attendee_id } });
    if (assignment) {
      assignment.defense_text = defense_text;
      await assignment.save();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Assignment not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Mark Fellow as Completed
router.put('/admin/sprints/:sprint_id/fellows/:attendee_id/complete', async (req, res) => {
  try {
    const { sprint_id, attendee_id } = req.params;
    const assignment = await SprintAssignment.findOne({ where: { sprint_id, attendee_id } });
    if (assignment) {
      assignment.is_completed = true;
      await assignment.save();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Assignment not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Export All Data
router.get('/admin/export', async (req, res) => {
  try {
    const attendees = await Attendee.findAll();
    const scores = await Score.findAll();
    const assignments = await SprintAssignment.findAll();
    const pollResponses = await PollResponse.findAll();
    res.json({ attendees, scores, assignments, pollResponses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Reset Data
router.post('/admin/reset', async (req, res) => {
  try {
    // We cannot drop tables, so we just destroy all non-admin data
    await Score.destroy({ where: {} });
    await PollResponse.destroy({ where: {} });
    await SprintAssignment.destroy({ where: {} });
    // Keep the Admin attendee, remove others
    await Attendee.destroy({ where: { is_admin: false } });
    
    // Also reset sprint locks
    await Sprint.update({ is_locked: true }, { where: {} });
    
    // Reset AppSetting for Poll
    const setting = await AppSetting.findByPk('poll_locked');
    if (setting) {
      setting.value = 'true';
      await setting.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Poll Locked status
router.get('/settings/poll_locked', async (req, res) => {
  try {
    const setting = await AppSetting.findByPk('poll_locked');
    res.json({ locked: setting ? setting.value === 'true' : true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Unlock Poll
router.post('/admin/settings/poll_unlock', async (req, res) => {
  try {
    let setting = await AppSetting.findByPk('poll_locked');
    if (setting) {
      setting.value = 'false';
      await setting.save();
    } else {
      await AppSetting.create({ key: 'poll_locked', value: 'false' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
