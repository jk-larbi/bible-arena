// ============================================================================
// BIBLEARENA TRUE/FALSE, FINISH THE STORY & CATEGORY CONNECTIONS DATA BANK
// 70 Authentic Entries for True/False, Finish Story, Memory, Categories, Connections
// ============================================================================

export interface TrueFalseEntryData {
  levelGroup: number;
  prompt: string;
  isTrue: boolean;
  reference: string;
  explanation: string;
}

export interface FinishStoryEntryData {
  levelGroup: number;
  prompt: string;
  climaxChoices: [string, string, string, string];
  correctChoiceIndex: number;
  reference: string;
  explanation: string;
}

export interface MemoryChallengeEntryData {
  levelGroup: number;
  verseText: string;
  reference: string;
  blankWords: string[];
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation: string;
}

export const TRUE_FALSE_BANK: TrueFalseEntryData[] = [
  // --- STAGE 1: BEGINNER (Levels 1–10) ---
  {
    levelGroup: 1,
    prompt: 'True or False: Noah sent out a raven from the ark before sending out a dove.',
    isTrue: true,
    reference: 'Genesis 8:6-8',
    explanation: 'True! Genesis 8:7 states Noah first sent out a raven which kept flying back and forth until the waters dried up.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: The Bible explicitly states that an apple was the fruit eaten by Eve in Eden.',
    isTrue: false,
    reference: 'Genesis 3:6',
    explanation: 'False! Genesis only calls it "the fruit of the tree." Identifying it as an apple is a post-biblical tradition.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: Methuselah is the oldest recorded human in Scripture, living 969 years.',
    isTrue: true,
    reference: 'Genesis 5:27',
    explanation: 'True! "So all the days of Methuselah were nine hundred and sixty-nine years; and he died."',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: The Ark of the Covenant contained the golden pot of manna, Aaron’s rod that budded, and the tablets of the Law.',
    isTrue: true,
    reference: 'Hebrews 9:4',
    explanation: 'True! Hebrews 9:4 lists all three sacred items housed inside the gold-covered Ark of the Testimony.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: The creature that swallowed Jonah is identified in the original Hebrew text specifically as a blue whale.',
    isTrue: false,
    reference: 'Jonah 1:17',
    explanation: 'False! The Hebrew specifies "dag gadol" — a great fish or sea creature prepared by the Lord, not a blue whale.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: The Apostle Paul was originally born in the city of Tarsus in Cilicia.',
    isTrue: true,
    reference: 'Acts 22:3',
    explanation: 'True! Paul declared: "I am indeed a Jew, born in Tarsus of Cilicia, but brought up in this city at the feet of Gamaliel."',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: David had seven older brothers, making him the eighth son of Jesse of Bethlehem.',
    isTrue: true,
    reference: '1 Samuel 16:10-11',
    explanation: 'True! Jesse made seven of his sons pass before Samuel, and David was the youngest keeping the sheep.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: King Solomon had an army composed exclusively of 300 men with clay jars and torches.',
    isTrue: false,
    reference: 'Judges 7:7',
    explanation: 'False! It was Judge Gideon who led the 300 men with jars and torches against Midian, not Solomon.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: Jesus wept at the tomb of Lazarus before calling him forth from the dead.',
    isTrue: true,
    reference: 'John 11:35',
    explanation: 'True! "Jesus wept" (John 11:35) is the shortest verse in the English Bible, revealing His deep compassion.',
  },
  {
    levelGroup: 1,
    prompt: 'True or False: The Bible records that three kings named Caspar, Melchior, and Balthazar visited baby Jesus in the stable.',
    isTrue: false,
    reference: 'Matthew 2:1-11',
    explanation: 'False! Matthew mentions Magi from the East bringing three gifts (gold, frankincense, myrrh), but never names them or states there were three.',
  },

  // --- STAGE 2: EASY (Levels 11–20) ---
  {
    levelGroup: 2,
    prompt: 'True or False: Samson lost his strength because Delilah personally shaved off his seven locks of hair herself.',
    isTrue: false,
    reference: 'Judges 16:19',
    explanation: 'False! Scripture states: "She lulled him to sleep on her knees, and called for a man and had him shave off the seven locks."',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: The Ten Commandments were written by the finger of God on two stone tablets.',
    isTrue: true,
    reference: 'Exodus 31:18',
    explanation: 'True! "He gave Moses two tablets of the Testimony, tablets of stone, written with the finger of God."',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: John the Baptist and Jesus Christ were cousins, their mothers being relatives.',
    isTrue: true,
    reference: 'Luke 1:36',
    explanation: 'True! Gabriel told Mary: "Elizabeth your relative has also conceived a son in her old age."',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: Zacchaeus was the Roman centurion stationed in Capernaum whose servant was healed.',
    isTrue: false,
    reference: 'Luke 19:2',
    explanation: 'False! Zacchaeus was the Jewish chief tax collector in Jericho who climbed the sycamore tree.',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: The wall of Jericho collapsed outward, allowing the Israelites to march straight up into the city.',
    isTrue: true,
    reference: 'Joshua 6:20',
    explanation: 'True! "The wall fell down flat. Then the people went up into the city, every man straight before him."',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: Moses was permitted to cross the Jordan River and personally possess the Promised Land.',
    isTrue: false,
    reference: 'Deuteronomy 3:25-27; 34:4',
    explanation: 'False! Because Moses struck the rock at Meribah in anger, God permitted him to view the land from Mount Nebo, but not enter.',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: Elijah never died an earthly death, but ascended into heaven in a whirlwind by a chariot of fire.',
    isTrue: true,
    reference: '2 Kings 2:11',
    explanation: 'True! Elijah and Enoch are the two Old Testament figures recorded as taken directly by God without physical death.',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: The phrase "God helps those who help themselves" is a quote from the Book of Proverbs.',
    isTrue: false,
    reference: 'Historical origins',
    explanation: 'False! This phrase originates from ancient Greek fables (Aesop) and Benjamin Franklin, not the canonical Bible.',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: In Philippi, an earthquake shook open the prison doors while Paul and Silas were praying and singing hymns.',
    isTrue: true,
    reference: 'Acts 16:25-26',
    explanation: 'True! At midnight, a great earthquake shook the prison foundations, opening all doors and loosing everyone’s chains.',
  },
  {
    levelGroup: 2,
    prompt: 'True or False: Simon Peter was the only disciple who ran to inspect the empty tomb of Jesus on Resurrection Sunday.',
    isTrue: false,
    reference: 'John 20:2-4',
    explanation: 'False! Peter ran alongside the other disciple (John), who outran Peter and reached the tomb first.',
  },

  // --- STAGE 3: INTERMEDIATE (Levels 21–30) ---
  {
    levelGroup: 3,
    prompt: 'True or False: Rahab the harlot of Jericho is listed by Matthew in the genealogy of Jesus Christ.',
    isTrue: true,
    reference: 'Matthew 1:5',
    explanation: 'True! Salmon begot Boaz by Rahab, making Rahab the great-great-grandmother of King David.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: King Saul consulted a medium at Endor to summon the spirit of prophet Samuel before his death on Mount Gilboa.',
    isTrue: true,
    reference: '1 Samuel 28',
    explanation: 'True! In desperation when the Lord did not answer him, Saul sought the witch of Endor who raised Samuel.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: Apostle Thomas touched the nail prints in Jesus’ hands before saying "My Lord and my God!"',
    isTrue: true,
    reference: 'John 20:27-28',
    explanation: 'True! Jesus commanded Thomas: "Reach your finger here, and look at My hands; and put your hand into My side."',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: The shortest book in the Old Testament is the Book of Jonah with 4 chapters.',
    isTrue: false,
    reference: 'Book of Obadiah',
    explanation: 'False! The shortest book in the Old Testament is Obadiah, consisting of only a single chapter of 21 verses.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: Stephen’s face shone like the face of an angel while testifying before the Sanhedrin.',
    isTrue: true,
    reference: 'Acts 6:15',
    explanation: 'True! "All who sat in the council, looking steadfastly at him, saw his face as the face of an angel."',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: King Josiah became king of Judah at age twenty-five.',
    isTrue: false,
    reference: '2 Kings 22:1',
    explanation: 'False! Josiah was only eight years old when he became king in Jerusalem following Amon’s assassination.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: In John’s Gospel, Jesus washed the feet of His disciples during the Last Supper.',
    isTrue: true,
    reference: 'John 13:4-15',
    explanation: 'True! Jesus laid aside His garments, girded Himself with a towel, and washed the disciples’ feet as an example of servanthood.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: King Nebuchadnezzar lost his reason and grazed on grass like an ox for seven periods of time.',
    isTrue: true,
    reference: 'Daniel 4:32-34',
    explanation: 'True! Stricken with boanthropy due to his pride, Nebuchadnezzar dwelt with wild beasts until he acknowledged the Most High.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: Apostle Paul wrote the Epistle to the Hebrews with his own hand while in Rome.',
    isTrue: false,
    reference: 'Hebrews authorship',
    explanation: 'False! The author of Hebrews is anonymous in the canonical text; church traditions have varied between Paul, Apollos, Luke, or Barnabas.',
  },
  {
    levelGroup: 3,
    prompt: 'True or False: An angel struck the Roman centurion Cornelius blind when Peter arrived at his home in Caesarea.',
    isTrue: false,
    reference: 'Acts 10',
    explanation: 'False! Cornelius was never struck blind; it was Elymas the sorcerer in Cyprus whom Paul rebuked with blindness (Acts 13:11).',
  },

  // --- STAGE 4: CHALLENGING (Levels 31–40) ---
  {
    levelGroup: 4,
    prompt: 'True or False: The sun and moon stood still in the sky for nearly a whole day during Joshua’s battle at Gibeon.',
    isTrue: true,
    reference: 'Joshua 10:12-14',
    explanation: 'True! "The sun stood still, and the moon stopped, till the people had revenge upon their enemies."',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: Melchizedek is identified in Genesis as an ordained Levite high priest.',
    isTrue: false,
    reference: 'Genesis 14:18; Hebrews 7:1-6',
    explanation: 'False! Melchizedek preceded Levi by centuries; his priesthood was independent of and superior to the Levitical line.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: Prophet Ezekiel was among the Jewish exiles living by the River Chebar in Babylon.',
    isTrue: true,
    reference: 'Ezekiel 1:1',
    explanation: 'True! Ezekiel received his grand visions of the glory of God while among the captives by the Chebar canal.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: Prophet Jeremiah purchased a family field in Anathoth while the Babylonian army was actively besieging Jerusalem.',
    isTrue: true,
    reference: 'Jeremiah 32:6-15',
    explanation: 'True! Buying the field was a prophetic sign from God that houses, fields, and vineyards would once again be possessed in Judah.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: King David was permitted by God to personally build the temple because he was a man after God’s own heart.',
    isTrue: false,
    reference: '1 Chronicles 22:8',
    explanation: 'False! God told David: "You have shed much blood and have made great wars; you shall not build a house for My name."',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: When Paul was shipwrecked on the island of Malta, a deadly viper bit his hand, but he suffered no injury.',
    isTrue: true,
    reference: 'Acts 28:3-5',
    explanation: 'True! Paul shook the viper off into the campfire and felt no harm, fulfilling Christ’s promise in Mark 16:18.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: The name "Ichabod" given to Phinehas’s son means "The Lord is my banner."',
    isTrue: false,
    reference: '1 Samuel 4:21',
    explanation: 'False! "Ichabod" means "The glory has departed," named because the Ark of God had been captured by the Philistines.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: Apostle Peter was freed from Herod Agrippa’s prison by an angel who made his iron chains fall off silently.',
    isTrue: true,
    reference: 'Acts 12:6-10',
    explanation: 'True! While the church prayed earnestly at Mary’s house, an angel led Peter past guards and through the self-opening iron gate.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: King Hezekiah built an aqueduct through solid bedrock to transport water into Jerusalem during the Assyrian invasion.',
    isTrue: true,
    reference: '2 Kings 20:20; 2 Chronicles 32:30',
    explanation: 'True! Hezekiah’s 1,750-foot tunnel brought water from the Gihon Spring into the Pool of Siloam, confirmed by archaeology.',
  },
  {
    levelGroup: 4,
    prompt: 'True or False: Queen Athaliah of Judah was the daughter of King David and Bathsheba.',
    isTrue: false,
    reference: '2 Kings 8:18, 26',
    explanation: 'False! Athaliah was the daughter of wicked King Ahab and Jezebel of Israel, who married King Jehoram of Judah.',
  },
];

export const FINISH_STORY_BANK: FinishStoryEntryData[] = [
  // --- STAGE 1: BEGINNER (Levels 1–10) ---
  {
    levelGroup: 1,
    prompt: 'Abraham bound his son Isaac on the altar upon Mount Moriah and stretched out his hand with the knife. At that critical instant, how did God resolve the narrative?',
    climaxChoices: [
      'The Angel called from heaven, stopped Abraham, and provided a ram caught by its horns in a thicket.',
      'Isaac broke the ropes and fled down the mountain into Beersheba.',
      'A great earthquake shook Mount Moriah and extinguished the altar fire.',
      'Melchizedek arrived with an offering of bread and sheep to replace Isaac.',
    ],
    correctChoiceIndex: 0,
    reference: 'Genesis 22:11-14',
    explanation: 'The Angel of the Lord called: "Do not lay your hand on the lad!" God provided a substitute ram, naming the place Yahweh-Jireh.',
  },
  {
    levelGroup: 1,
    prompt: 'Pharaoh’s six hundred chariots trapped the unarmed Israelites against the impassable waters of the Red Sea. What miraculous climax brought victory?',
    climaxChoices: [
      'Moses raised his staff, God parted the sea with a strong east wind, Israel crossed dry, and Egypt drowned as waters returned.',
      'A sudden plague struck the chariot horses, forcing Pharaoh to retreat to Cairo.',
      'Israel constructed rafts of acacia wood and floated across the waters overnight.',
      'The angel Gabriel slew all the chariot drivers with heavenly fire.',
    ],
    correctChoiceIndex: 0,
    reference: 'Exodus 14:21-31',
    explanation: 'The sea parted, Israel walked through on dry ground with walls of water on both sides, and Pharaoh’s army was submerged.',
  },
  {
    levelGroup: 1,
    prompt: 'Giant Goliath mocked the armies of Israel for 40 days, cursing young David by his Philistine gods. How did the battle climax?',
    climaxChoices: [
      'David hurled a single smooth stone that sank into Goliath’s forehead, dropping the giant facedown before cutting off his head.',
      'King Saul fired an arrow from the ridge that struck Goliath through the neck armor.',
      'Jonathan and his armor-bearer outflanked Goliath and captured the Philistine battle banner.',
      'A lightning strike from heaven incinerated Goliath’s spear in the Valley of Elah.',
    ],
    correctChoiceIndex: 0,
    reference: '1 Samuel 17:48-51',
    explanation: 'David struck the giant with his sling and stone; Goliath fell, and the Philistine army fled in panic.',
  },
  {
    levelGroup: 1,
    prompt: 'King Darius was tricked into casting his faithful advisor Daniel into the pit of hungry lions. When the king rushed to the den at dawn, what did he discover?',
    climaxChoices: [
      'Daniel was completely unharmed, declaring that God sent His angel to shut the lions’ mouths.',
      'Daniel had climbed to the top of the pit using royal garments.',
      'The lions had all perished from sudden pestilence during the night.',
      'Daniel had escaped through a secret subterranean tunnel leading to the Euphrates.',
    ],
    correctChoiceIndex: 0,
    reference: 'Daniel 6:19-23',
    explanation: 'Daniel was found untouched because he trusted in his God; Darius rejoiced and decreed praise to Yahweh across all satrapies.',
  },
  {
    levelGroup: 1,
    prompt: 'Peter fell to his knees in terror as water swirled around him on the stormy Sea of Galilee, crying: "Lord, save me!" How did Jesus resolve the moment?',
    climaxChoices: [
      'Jesus immediately stretched out His hand, caught Peter, gently rebuked his doubt, and the wind ceased when they entered the boat.',
      'The disciples threw Peter a rope and dragged him back into the vessel.',
      'A dolphin carried Peter back to shore while Jesus walked ahead.',
      'Peter swam to the boat while the storm continued raging violently.',
    ],
    correctChoiceIndex: 0,
    reference: 'Matthew 14:30-32',
    explanation: 'Jesus rescued Peter saying, "O you of little faith, why did you doubt?" and calm returned instantly.',
  },
];

export const BIBLE_CONNECTIONS_BANK = [
  {
    levelGroup: 1,
    title: 'Foundational Scripture Quartets',
    groups: [
      {
        category: 'Original Patriarchs',
        items: ['Abraham', 'Isaac', 'Jacob', 'Joseph'] as [string, string, string, string],
        difficulty: 1 as const,
      },
      {
        category: 'Gospel Writers (Evangelists)',
        items: ['Matthew', 'Mark', 'Luke', 'John'] as [string, string, string, string],
        difficulty: 2 as const,
      },
      {
        category: 'Major Prophets',
        items: ['Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'] as [string, string, string, string],
        difficulty: 3 as const,
      },
      {
        category: 'Sons of Jacob by Leah',
        items: ['Reuben', 'Simeon', 'Levi', 'Judah'] as [string, string, string, string],
        difficulty: 4 as const,
      },
    ],
  },
  {
    levelGroup: 2,
    title: 'Monarchs, Apostles & Mountains',
    groups: [
      {
        category: 'Kings of the United Monarchy',
        items: ['Saul', 'David', 'Solomon', 'Rehoboam'] as [string, string, string, string],
        difficulty: 1 as const,
      },
      {
        category: 'Sacred Biblical Mountains',
        items: ['Sinai', 'Carmel', 'Moriah', 'Hermon'] as [string, string, string, string],
        difficulty: 2 as const,
      },
      {
        category: 'Fishermen Apostles of Galilee',
        items: ['Peter', 'Andrew', 'James', 'John'] as [string, string, string, string],
        difficulty: 3 as const,
      },
      {
        category: 'Plagues on Egypt (Animals & Insects)',
        items: ['Frogs', 'Lice (Gnats)', 'Flies', 'Locusts'] as [string, string, string, string],
        difficulty: 4 as const,
      },
    ],
  },
];
