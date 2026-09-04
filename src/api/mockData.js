export const getBabyGrowthForWeek = (week = 1) => {
  const safeWeek = Math.max(1, Math.min(40, week));
  const growthMilestones = {
    1: { comparison: 'size of a poppy seed', dimensions: 'Approx. 0.04 in • < 0.01 oz', emoji: '🌱', description: 'Fertilization occurs and cell division begins rapidly.', highlights: ['Blastocyst forms', 'Implantation beginning'] },
    4: { comparison: 'size of a poppy seed', dimensions: 'Approx. 0.04 in • < 0.01 oz', emoji: '🌱', description: 'The blastocyst is officially an embryo and has implanted into your uterine lining.', highlights: ['Amniotic sac developing', 'Placenta forming'] },
    8: { comparison: 'size of a raspberry', dimensions: 'Approx. 0.6 in • 0.04 oz', emoji: '🫐', description: 'Little hands and feet are webbed, and facial features are taking shape.', highlights: ['Taste buds forming', 'Nerve cells branching out'] },
    12: { comparison: 'size of a plum', dimensions: 'Approx. 2.1 in • 0.49 oz', emoji: '🍑', description: 'All major organ systems are fully formed and reflexes are developing.', highlights: ['Kidneys producing urine', 'Fingers curling'] },
    14: { comparison: 'size of an avocado', dimensions: 'Approx. 3.4 in (8.7 cm) • 1.5 oz (43 g)', emoji: '🥑', description: 'Your baby is now making tiny facial expressions! Their fingerprints are fully formed.', highlights: ['Fingerprints unique', 'Thyroid producing hormones', 'Swallowing movements'] },
    20: { comparison: 'size of a banana', dimensions: 'Approx. 10.2 in • 10.6 oz', emoji: '🍌', description: 'Halfway mark! Baby can hear your voice and is moving around actively.', highlights: ['Hearing developed', 'Vernix coating baby’s skin'] },
    28: { comparison: 'size of an eggplant', dimensions: 'Approx. 14.8 in • 2.2 lb', emoji: '🍆', description: 'Baby can blink their eyes and has sleep and wake cycles.', highlights: ['Eyes opening and closing', 'Brain wave activity'] },
    36: { comparison: 'size of a papaya', dimensions: 'Approx. 18.7 in • 5.8 lb', emoji: '🍈', description: 'Baby is gaining rapid weight and shedding fine lanugo hair.', highlights: ['Lungs almost mature', 'Head may be engaging down'] },
    40: { comparison: 'size of a watermelon', dimensions: 'Approx. 20.2 in • 7.6 lb', emoji: '🍉', description: 'Baby is full term and ready to meet you any day now!', highlights: ['Full term milestones met', 'Ready for birth'] }
  };

  const closestWeek = Object.keys(growthMilestones)
    .map(Number)
    .reduce((prev, curr) => (Math.abs(curr - safeWeek) < Math.abs(prev - safeWeek) ? curr : prev), 14);

  return {
    week: safeWeek,
    ...growthMilestones[closestWeek]
  };
};

export const initialTrackerData = {
  user: null,
  pregnancy: null,
  babyGrowth: null,
  emergencyContact: null,
  calendarEvents: [
    // type: 'appointment' (pink), 'milestone' (green), 'reminder' (orange)
    { day: 5, type: "reminder", title: "Order prenatal vitamin refills", time: "9:00 AM" },
    { day: 9, type: "appointment", title: "Dr. Jenkins - 2nd Trimester Ultrasound", time: "10:30 AM" },
    { day: 14, type: "milestone", title: "Week 14 Milestone: 2nd Trimester Entry!", time: "All Day" },
    { day: 20, type: "reminder", title: "Hydration check & pelvic floor exercises", time: "2:00 PM" },
    { day: 23, type: "appointment", title: "Routine blood pressure & anatomy review", time: "11:15 AM" },
    { day: 27, type: "milestone", title: "Baby kicks feeling milestone checkpoint", time: "All Day" }
  ]
};
