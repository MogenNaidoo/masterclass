const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendee = sequelize.define('Attendee', {
    attendee_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
    company: { type: DataTypes.STRING } // Added company here since Fellow is gone
  });

  const Sprint = sequelize.define('Sprint', {
    sprint_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    order: { type: DataTypes.INTEGER, allowNull: false },
    is_locked: { type: DataTypes.BOOLEAN, defaultValue: true }
  });

  const SprintAssignment = sequelize.define('SprintAssignment', {
    assignment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sprint_id: { type: DataTypes.INTEGER, references: { model: Sprint, key: 'sprint_id' } },
    attendee_id: { type: DataTypes.INTEGER, references: { model: Attendee, key: 'attendee_id' } },
    order: { type: DataTypes.INTEGER, defaultValue: 0 }, // Optional presentation order
    scenario: { type: DataTypes.STRING }, // e.g. "Scenario 1: Price too low"
    defense_text: { type: DataTypes.TEXT },
    is_completed: { type: DataTypes.BOOLEAN, defaultValue: false }
  });

  const ScoreCriterion = sequelize.define('ScoreCriterion', {
    criterion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sprint_id: { type: DataTypes.INTEGER, references: { model: Sprint, key: 'sprint_id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    max_points: { type: DataTypes.INTEGER, defaultValue: 1 }
  });

  const Score = sequelize.define('Score', {
    score_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendee_id: { type: DataTypes.INTEGER, references: { model: Attendee, key: 'attendee_id' } }, // Who voted
    target_attendee_id: { type: DataTypes.INTEGER, references: { model: Attendee, key: 'attendee_id' } }, // Who was voted on
    criterion_id: { type: DataTypes.INTEGER, references: { model: ScoreCriterion, key: 'criterion_id' } },
    points: { type: DataTypes.INTEGER, allowNull: false }
  });

  const PollQuestion = sequelize.define('PollQuestion', {
    question_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    option_a: { type: DataTypes.STRING, allowNull: false },
    option_b: { type: DataTypes.STRING, allowNull: false },
    option_c: { type: DataTypes.STRING, allowNull: false },
    option_d: { type: DataTypes.STRING, allowNull: false },
    correct_option: { type: DataTypes.STRING, allowNull: false } // e.g., 'A', 'B', 'C', 'D'
  });

  const PollResponse = sequelize.define('PollResponse', {
    response_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendee_id: { type: DataTypes.INTEGER, references: { model: Attendee, key: 'attendee_id' } },
    question_id: { type: DataTypes.INTEGER, references: { model: PollQuestion, key: 'question_id' } },
    chosen_option: { type: DataTypes.STRING, allowNull: false },
    is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },
    points: { type: DataTypes.INTEGER, defaultValue: 0 }
  });

  const AppSetting = sequelize.define('AppSetting', {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.STRING }
  });

  // Relationships
  Sprint.hasMany(ScoreCriterion, { foreignKey: 'sprint_id' });
  ScoreCriterion.belongsTo(Sprint, { foreignKey: 'sprint_id' });

  // Assignments
  Sprint.hasMany(SprintAssignment, { foreignKey: 'sprint_id' });
  SprintAssignment.belongsTo(Sprint, { foreignKey: 'sprint_id' });
  Attendee.hasMany(SprintAssignment, { foreignKey: 'attendee_id' });
  SprintAssignment.belongsTo(Attendee, { foreignKey: 'attendee_id' });

  // Scores
  Attendee.hasMany(Score, { foreignKey: 'attendee_id', as: 'GivenScores' });
  Score.belongsTo(Attendee, { foreignKey: 'attendee_id', as: 'Scorer' });

  Attendee.hasMany(Score, { foreignKey: 'target_attendee_id', as: 'ReceivedScores' });
  Score.belongsTo(Attendee, { foreignKey: 'target_attendee_id', as: 'Target' });

  ScoreCriterion.hasMany(Score, { foreignKey: 'criterion_id' });
  Score.belongsTo(ScoreCriterion, { foreignKey: 'criterion_id' });

  // Polls
  Attendee.hasMany(PollResponse, { foreignKey: 'attendee_id' });
  PollResponse.belongsTo(Attendee, { foreignKey: 'attendee_id' });

  PollQuestion.hasMany(PollResponse, { foreignKey: 'question_id' });
  PollResponse.belongsTo(PollQuestion, { foreignKey: 'question_id' });

  return {
    Attendee,
    Sprint,
    SprintAssignment,
    ScoreCriterion,
    Score,
    PollQuestion,
    PollResponse,
    AppSetting
  };
};
