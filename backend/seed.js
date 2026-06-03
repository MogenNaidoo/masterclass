const { sequelize, Sprint, ScoreCriterion, PollQuestion, Attendee, SprintAssignment, AppSetting } = require('./models');

async function seed() {
  await sequelize.sync({ force: true }); // Reset database

  // Create Admin
  await Attendee.create({ full_name: 'EIR Admin', email: 'admin@antigravity.com', is_admin: true, company: 'Antigravity' });

  // Removed dummy attendees - only real users who log in will be available for selection

  // Create Sprints
  const sprintsData = [
    { name: 'Sprint 1', description: 'Prospecting Lab (Hot Seat)', order: 1, is_locked: true }, // Set default to true now
    { name: 'Sprint 2', description: 'Prospecting Lab', order: 2, is_locked: true },
    { name: 'Sprint 3', description: 'Pricing Lab', order: 3, is_locked: true }
  ];
  const sprints = await Sprint.bulkCreate(sprintsData);

  // Create Score Criteria for Sprint 1
  await ScoreCriterion.bulkCreate([
    { sprint_id: sprints[0].sprint_id, name: 'Clear customer type' },
    { sprint_id: sprints[0].sprint_id, name: 'Specific core problem' },
    { sprint_id: sprints[0].sprint_id, name: 'Desired outcome' },
    { sprint_id: sprints[0].sprint_id, name: 'Outside-in framing' },
    { sprint_id: sprints[0].sprint_id, name: 'Clear next step' }
  ]);

  // Create Score Criteria for Sprint 2
  await ScoreCriterion.bulkCreate([
    { sprint_id: sprints[1].sprint_id, name: 'Protected value (no discount)' },
    { sprint_id: sprints[1].sprint_id, name: 'Led with benefits' },
    { sprint_id: sprints[1].sprint_id, name: 'Obvious next step' }
  ]);

  // Create Score Criteria for Sprint 3
  await ScoreCriterion.bulkCreate([
    { sprint_id: sprints[2].sprint_id, name: 'Clear problem diagnosis' },
    { sprint_id: sprints[2].sprint_id, name: 'Value-based pricing logic' },
    { sprint_id: sprints[2].sprint_id, name: 'Margin protection' },
    { sprint_id: sprints[2].sprint_id, name: 'Linkage to cost of inaction' },
    { sprint_id: sprints[2].sprint_id, name: 'Confident next step' }
  ]);

  // Create Poll Questions
  await PollQuestion.bulkCreate([
    {
      text: 'Goal of the first sales message?',
      option_a: 'Close a sale',
      option_b: 'Earn the next conversation',
      option_c: 'Provide a discount',
      option_d: 'Send a brochure',
      correct_option: 'B'
    },
    {
      text: 'What should a 15-second opener include?',
      option_a: 'Company history',
      option_b: 'Product features',
      option_c: 'Customer type, problem, outcome and ask',
      option_d: 'Pricing details',
      correct_option: 'C'
    },
    {
      text: 'When prospects jump straight to price, what’s the real issue?',
      option_a: 'They are cheap',
      option_b: 'The value case is not yet clear',
      option_c: 'Competitors are cheaper',
      option_d: 'They have no budget',
      correct_option: 'B'
    },
    {
      text: 'What makes an Ideal Customer Profile (ICP) strong?',
      option_a: 'Any company with money',
      option_b: 'The customer has the problem, budget and urgency',
      option_c: 'Large enterprises only',
      option_d: 'Startups only',
      correct_option: 'B'
    },
    {
      text: 'What should come before pricing in a proposal?',
      option_a: 'Discounts',
      option_b: 'Clear value and problem framing',
      option_c: 'Terms and conditions',
      option_d: 'Signatures',
      correct_option: 'B'
    },
    {
      text: 'Best first response to a pricing objection?',
      option_a: 'Clarify the concern before defending the price',
      option_b: 'Offer a 10% discount immediately',
      option_c: 'Walk away',
      option_d: 'Explain your costs',
      correct_option: 'A'
    },
    {
      text: 'What does “Proof” do in a proposal?',
      option_a: 'Nothing',
      option_b: 'Guarantees a sale',
      option_c: 'Validates credibility with evidence or results',
      option_d: 'Makes the document longer',
      correct_option: 'C'
    },
    {
      text: 'What is the cost of inaction?',
      option_a: 'The price of your product',
      option_b: 'What the customer keeps losing by not solving the problem',
      option_c: 'Opportunity cost for the salesperson',
      option_d: 'A hidden fee',
      correct_option: 'B'
    }
  ]);

  // Set Poll as Locked by default
  await AppSetting.create({ key: 'poll_locked', value: 'true' });

  console.log('Database seeded successfully with new unified schema');
}

seed().catch(err => {
  console.error('Error seeding DB:', err);
});
