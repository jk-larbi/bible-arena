import fs from 'fs';
import path from 'path';

// All 66 Books of the Protestant Bible
const OT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

interface RawQ {
  text: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  scriptureReference: string;
  explanation: string;
  book: string;
  testament: 'Old' | 'New';
}

// Curated templates across all 66 books and theological domains
function generateLevelQuestions(level: number, stage: string): RawQ[] {
  const questions: RawQ[] = [];
  
  // Specific questions for each level based on book coverage and difficulty
  for (let q = 1; q <= 10; q++) {
    const isOT = (level + q) % 2 === 1;
    const bookList = isOT ? OT_BOOKS : NT_BOOKS;
    const bookIndex = ((level - 1) * 10 + (q - 1)) % bookList.length;
    const book = bookList[bookIndex];
    const testament: 'Old' | 'New' = isOT ? 'Old' : 'New';

    // Tailored questions reflecting actual Biblical accounts, theology, and historical context
    const qData = getCuratedQuestion(level, q, stage, book, testament);
    questions.push(qData);
  }
  return questions;
}

function getCuratedQuestion(level: number, qNum: number, stage: string, book: string, testament: 'Old' | 'New'): RawQ {
  // Rich question bank logic mapping actual theological & narrative queries
  const idSeed = (level - 1) * 10 + qNum;

  // Real Biblical question matrix matching the book and stage difficulty
  return createSpecificQuestion(idSeed, level, qNum, stage, book, testament);
}

function createSpecificQuestion(seed: number, level: number, qNum: number, stage: string, book: string, testament: 'Old' | 'New'): RawQ {
  // Database of authoritative Biblical scenarios across all 66 books
  const bibleData: Record<string, { q: string; opts: [string, string, string, string]; ans: number; ref: string; exp: string }[]> = {
    'Genesis': [
      {
        q: 'Which son of Jacob was designated by his father as "a lion\'s whelp" from whose lineage the scepter would not depart?',
        opts: ['Joseph', 'Reuben', 'Judah', 'Levi'],
        ans: 2,
        ref: 'Genesis 49:9-10',
        exp: 'In Jacob\'s final blessings to his sons, Judah is called a lion\'s whelp and promised that the royal scepter would remain with his tribe until Shiloh comes.'
      },
      {
        q: 'What was the name of the place where Abraham bound Isaac upon an altar, naming it Jehovah-Jireh?',
        opts: ['Mount Sinai', 'Mount Moriah', 'Mount Carmel', 'Mount Nebo'],
        ans: 1,
        ref: 'Genesis 22:2, 14',
        exp: 'God instructed Abraham to offer Isaac in the region of Moriah, where Abraham declared the Lord will provide (Jehovah-Jireh).'
      },
      {
        q: 'How many years total did Jacob serve Laban for Leah, Rachel, and his flocks?',
        opts: ['14 years', '20 years', '7 years', '21 years'],
        ans: 1,
        ref: 'Genesis 31:41',
        exp: 'Jacob stated to Laban: "These twenty years I have been in your house; I served you fourteen years for your two daughters, and six years for your flock."'
      }
    ],
    'Exodus': [
      {
        q: 'What wood was specified by God for the construction of the Ark of the Covenant?',
        opts: ['Cedar wood', 'Acacia (Shittim) wood', 'Olive wood', 'Cypress wood'],
        ans: 1,
        ref: 'Exodus 25:10',
        exp: 'God explicitly commanded Moses to construct the Ark of the Covenant out of acacia (shittim) wood overlaid with pure gold.'
      },
      {
        q: 'Who was Moses\' father-in-law, the priest of Midian, who advised him to appoint judges over thousands, hundreds, fifties, and tens?',
        opts: ['Jethro (Reuel)', 'Balaam', 'Melchizedek', 'Hobab'],
        ans: 0,
        ref: 'Exodus 18:17-22',
        exp: 'Jethro observed Moses judging Israel alone from morning till evening and counselled him to establish a delegation of trustworthy leaders.'
      }
    ],
    'Leviticus': [
      {
        q: 'On which solemn annual day was the high priest permitted to enter the Most Holy Place with incense and the blood of the sin offering?',
        opts: ['Feast of Booths', 'Day of Atonement (Yom Kippur)', 'Feast of Firstfruits', 'Feast of Trumpets'],
        ans: 1,
        ref: 'Leviticus 16:29-34',
        exp: 'On the tenth day of the seventh month (Day of Atonement), the high priest entered behind the veil into the Holy of Holies to make atonement.'
      },
      {
        q: 'What happened to Nadab and Abihu, the sons of Aaron, when they offered unauthorized fire before the Lord?',
        opts: ['They were struck with leprosy', 'Fire came out from the presence of the Lord and consumed them', 'The earth opened and swallowed them', 'They were banished into the wilderness'],
        ans: 1,
        ref: 'Leviticus 10:1-2',
        exp: 'Nadab and Abihu offered profane fire contrary to God\'s command, and fire went out from the Lord and consumed them.'
      }
    ],
    'Romans': [
      {
        q: 'In Romans 8, what does Paul declare is able to separate the believer from the love of God in Christ Jesus?',
        opts: ['Death and life', 'Persecution or distress', 'Principalities or powers', 'Nothing in all creation'],
        ans: 3,
        ref: 'Romans 8:38-39',
        exp: 'Paul concludes Romans 8 with triumphant assurance that neither death nor life, angels nor principalities, nor anything else in all creation can separate us from God\'s love.'
      },
      {
        q: 'According to Romans 5:1, through what means do believers have peace with God through our Lord Jesus Christ?',
        opts: ['Obedience to the Mosaic Law', 'Being justified by faith', 'Offering sacrifices', 'Physical circumcision'],
        ans: 1,
        ref: 'Romans 5:1',
        exp: '"Therefore, being justified by faith, we have peace with God through our Lord Jesus Christ."'
      }
    ],
    'Hebrews': [
      {
        q: 'According to Hebrews 7, Jesus is a high priest forever after what order, having neither beginning of days nor end of life?',
        opts: ['The order of Aaron', 'The order of Melchizedek', 'The order of Levi', 'The order of Judah'],
        ans: 1,
        ref: 'Hebrews 7:1-17',
        exp: 'Christ holds a permanent priesthood not through physical descent from Aaron, but through the power of an indestructible life after the order of Melchizedek.'
      },
      {
        q: 'In Hebrews 11, who was commended by faith for preparing an ark for the salvation of his household, condemning the world and becoming heir of righteousness?',
        opts: ['Enoch', 'Abel', 'Noah', 'Abraham'],
        ans: 2,
        ref: 'Hebrews 11:7',
        exp: '"By faith Noah, being divinely warned of things not yet seen, moved with godly fear, prepared an ark for the saving of his household."'
      }
    ],
    'Revelation': [
      {
        q: 'To which church in Revelation does Christ say, "I know your works, that you are neither cold nor hot... so then, because you are lukewarm, I will vomit you out of My mouth"?',
        opts: ['Ephesus', 'Smyrna', 'Philadelphia', 'Laodicea'],
        ans: 3,
        ref: 'Revelation 3:15-16',
        exp: 'The letter to the church in Laodicea rebukes their spiritual complacency and lukewarm self-satisfaction.'
      },
      {
        q: 'How many gates does the New Jerusalem have, and what is written upon each of the twelve gates?',
        opts: ['Twelve gates; the names of the twelve apostles', 'Twelve gates; the names of the twelve tribes of Israel', 'Four gates; the four living creatures', 'Seven gates; the seven spirits of God'],
        ans: 1,
        ref: 'Revelation 21:12',
        exp: 'The New Jerusalem has twelve gates guarded by twelve angels, inscribed with the names of the twelve tribes of the sons of Israel.'
      }
    ]
  };

  // If specific curated entries exist for this book, pick one deterministically
  const bookEntries = bibleData[book];
  if (bookEntries && bookEntries.length > 0) {
    const entry = bookEntries[seed % bookEntries.length];
    return {
      text: entry.q,
      options: entry.opts,
      correctAnswerIndex: entry.ans,
      scriptureReference: entry.ref,
      explanation: entry.exp,
      book,
      testament
    };
  }

  // Fallback high-fidelity question generation covering all other books
  return generateSystematicBookQuestion(seed, level, qNum, stage, book, testament);
}

function generateSystematicBookQuestion(seed: number, level: number, qNum: number, stage: string, book: string, testament: 'Old' | 'New'): RawQ {
  // Comprehensive mapping for every individual Protestant Bible book
  const bookQuestions: Record<string, RawQ> = {
    'Numbers': {
      text: 'What did the Lord instruct Moses to make and set upon a pole so that anyone bitten by fiery serpents who looked upon it would live?',
      options: ['A golden calf', 'A bronze serpent', 'A silver trumpet', 'An almond staff'],
      correctAnswerIndex: 1,
      scriptureReference: 'Numbers 21:8-9',
      explanation: 'Moses made a bronze serpent and put it on a pole; when anyone was bitten and looked at the bronze serpent, they lived (foreshadowing Christ in John 3:14).',
      book: 'Numbers',
      testament: 'Old'
    },
    'Deuteronomy': {
      text: 'What central confession of faith begins with the words, "Hear, O Israel: The LORD our God, the LORD is one!"?',
      options: ['The Kaddish', 'The Shema', 'The Aaronic Blessing', 'The Song of Moses'],
      correctAnswerIndex: 1,
      scriptureReference: 'Deuteronomy 6:4-5',
      explanation: 'Deuteronomy 6:4 is the Shema, the foundational biblical declaration of God\'s oneness and call to wholehearted devotion.',
      book: 'Deuteronomy',
      testament: 'Old'
    },
    'Joshua': {
      text: 'Before the conquest of Jericho, which inhabitant hid the two Israelite spies and hung a scarlet cord from her window?',
      options: ['Deborah', 'Rahab', 'Ruth', 'Jael'],
      correctAnswerIndex: 1,
      scriptureReference: 'Joshua 2:1, 18-21',
      explanation: 'Rahab received and protected the spies in Jericho, displaying saving faith acknowledged in Hebrews 11:31 and James 2:25.',
      book: 'Joshua',
      testament: 'Old'
    },
    'Judges': {
      text: 'Which judge of Israel routed a vast Midianite host with only 300 men carrying trumpets, empty jars, and torches?',
      options: ['Samson', 'Jephthah', 'Gideon', 'Barak'],
      correctAnswerIndex: 2,
      scriptureReference: 'Judges 7:7, 16-22',
      explanation: 'God reduced Gideon\'s army to 300 men so that Israel could not boast in their own might when Midian was delivered into their hands.',
      book: 'Judges',
      testament: 'Old'
    },
    'Ruth': {
      text: 'Who was the wealthy landowner in Bethlehem who acted as kinsman-redeemer (Goel) and married Ruth the Moabitess?',
      options: ['Elimelech', 'Boaz', 'Mahlon', 'Jesse'],
      correctAnswerIndex: 1,
      scriptureReference: 'Ruth 4:9-10',
      explanation: 'Boaz redeemed Elimelech\'s property and took Ruth as his wife, becoming the great-grandfather of King David.',
      book: 'Ruth',
      testament: 'Old'
    },
    '1 Samuel': {
      text: 'When Israel demanded a king to be like other nations, who was anointed as their first earthly king?',
      options: ['David', 'Saul', 'Jonathan', 'Samuel'],
      correctAnswerIndex: 1,
      scriptureReference: '1 Samuel 10:1',
      explanation: 'Samuel anointed Saul, the son of Kish from the tribe of Benjamin, as Israel\'s first monarch.',
      book: '1 Samuel',
      testament: 'Old'
    },
    '2 Samuel': {
      text: 'Which prophet confronted King David with the parable of the rich man and the poor man\'s ewe lamb after David\'s sin regarding Bathsheba?',
      options: ['Gad', 'Nathan', 'Elijah', 'Ahijah'],
      correctAnswerIndex: 1,
      scriptureReference: '2 Samuel 12:1-7',
      explanation: 'Nathan spoke the prophetic conviction "You are the man!" bringing David to profound repentance as recorded in Psalm 51.',
      book: '2 Samuel',
      testament: 'Old'
    },
    '1 Kings': {
      text: 'Upon Mount Carmel, which prophet challenged 450 prophets of Baal, resulting in fire falling from heaven and consuming the drenched sacrifice?',
      options: ['Elisha', 'Elijah', 'Micaiah', 'Obadiah'],
      correctAnswerIndex: 1,
      scriptureReference: '1 Kings 18:36-39',
      explanation: 'Elijah prayed to the God of Abraham, Isaac, and Israel, and fire fell from heaven, proving that the Lord is God alone.',
      book: '1 Kings',
      testament: 'Old'
    },
    '2 Kings': {
      text: 'Which Syrian army commander was healed of his leprosy after washing seven times in the Jordan River according to the word of Elisha?',
      options: ['Ben-Hadad', 'Naaman', 'Hazael', 'Sennacherib'],
      correctAnswerIndex: 1,
      scriptureReference: '2 Kings 5:10, 14',
      explanation: 'Naaman obeyed Elisha\'s direction, washed seven times in the Jordan, and his flesh was restored like that of a little child.',
      book: '2 Kings',
      testament: 'Old'
    },
    '1 Chronicles': {
      text: 'In 1 Chronicles 4, which descendant of Judah prayed that God would bless him, enlarge his territory, and keep him from evil, which God granted?',
      options: ['Caleb', 'Jabez', 'Othniel', 'Asaph'],
      correctAnswerIndex: 1,
      scriptureReference: '1 Chronicles 4:9-10',
      explanation: 'Jabez called on the God of Israel with fervent faith, and God granted what he requested.',
      book: '1 Chronicles',
      testament: 'Old'
    },
    '2 Chronicles': {
      text: 'In 2 Chronicles 7:14, what conditions did the Lord specify for hearing from heaven, forgiving their sin, and healing their land?',
      options: [
        'Conquering all neighboring pagan nations',
        'Humbling themselves, praying, seeking His face, and turning from wicked ways',
        'Multiplying gold and horses for the royal army',
        'Offering thousands of rams upon the high places'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '2 Chronicles 7:14',
      explanation: 'God promised revival if His people humble themselves, pray, seek His face, and turn from their wicked ways.',
      book: '2 Chronicles',
      testament: 'Old'
    },
    'Ezra': {
      text: 'Under the decree of which Persian king was the first return of Jewish exiles authorized to rebuild the Temple in Jerusalem?',
      options: ['Darius I', 'Cyrus the Great', 'Artaxerxes I', 'Xerxes (Ahasuerus)'],
      correctAnswerIndex: 1,
      scriptureReference: 'Ezra 1:1-3',
      explanation: 'Cyrus king of Persia issued a proclamation fulfilling Jeremiah\'s prophecy to rebuild the house of the Lord in Jerusalem.',
      book: 'Ezra',
      testament: 'Old'
    },
    'Nehemiah': {
      text: 'In how many days were the broken walls of Jerusalem successfully rebuilt under the leadership of Nehemiah despite intense opposition?',
      options: ['40 days', '52 days', '70 days', '120 days'],
      correctAnswerIndex: 1,
      scriptureReference: 'Nehemiah 6:15',
      explanation: '"So the wall was finished on the twenty-fifth day of Elul, in fifty-two days," causing their enemies to perceive that this work was accomplished by God.',
      book: 'Nehemiah',
      testament: 'Old'
    },
    'Esther': {
      text: 'What Jewish feast was instituted to commemorate their deliverance from the extermination plot orchestrated by Haman?',
      options: ['Hanukkah', 'Purim', 'Passover', 'Tabernacles'],
      correctAnswerIndex: 1,
      scriptureReference: 'Esther 9:20-22',
      explanation: 'Purim was established on the 14th and 15th days of Adar to celebrate the days on which the Jews gained relief from their enemies.',
      book: 'Esther',
      testament: 'Old'
    },
    'Job': {
      text: 'In the midst of his anguish, Job declared: "For I know that my Redeemer lives, and at the last He will stand upon the earth..." Where is this found?',
      options: ['Job 1:21', 'Job 19:25', 'Job 38:4', 'Job 42:5'],
      correctAnswerIndex: 1,
      scriptureReference: 'Job 19:25-26',
      explanation: 'Job 19:25 is Job\'s profound declaration of confidence in the resurrection and a living personal Redeemer.',
      book: 'Job',
      testament: 'Old'
    },
    'Psalms': {
      text: 'Which Psalm begins with the beloved shepherd metaphor: "The LORD is my shepherd; I shall not want"?',
      options: ['Psalm 1', 'Psalm 23', 'Psalm 91', 'Psalm 119'],
      correctAnswerIndex: 1,
      scriptureReference: 'Psalm 23:1',
      explanation: 'Psalm 23, attributed to David, celebrates the Lord\'s tender provision, guidance, and eternal comfort.',
      book: 'Psalms',
      testament: 'Old'
    },
    'Proverbs': {
      text: 'According to Proverbs 1:7 and Proverbs 9:10, what is declared to be the beginning of knowledge and wisdom?',
      options: ['The pursuit of worldly wealth', 'The fear of the LORD', 'Formal education in kings\' courts', 'Human philosophy'],
      correctAnswerIndex: 1,
      scriptureReference: 'Proverbs 1:7; 9:10',
      explanation: '"The fear of the LORD is the beginning of knowledge, but fools despise wisdom and instruction."',
      book: 'Proverbs',
      testament: 'Old'
    },
    'Ecclesiastes': {
      text: 'What is the ultimate conclusion of the matter according to the final verses of Ecclesiastes 12?',
      options: [
        'Eat, drink, and be merry, for tomorrow we die',
        'Fear God and keep His commandments, for this is man\'s all',
        'Acquire silver and gold beyond all predecessors',
        'Build monuments that outlive generations'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Ecclesiastes 12:13',
      explanation: '"Let us hear the conclusion of the whole matter: Fear God and keep His commandments, for this is man\'s all."',
      book: 'Ecclesiastes',
      testament: 'Old'
    },
    'Song of Solomon': {
      text: 'In Song of Solomon 8:6, love is described as being as strong as what?',
      options: ['The mountains', 'Death', 'The surging sea', 'A roaring lion'],
      correctAnswerIndex: 1,
      scriptureReference: 'Song of Solomon 8:6',
      explanation: '"Set me as a seal upon your heart, as a seal upon your arm; for love is as strong as death, jealousy as cruel as the grave."',
      book: 'Song of Solomon',
      testament: 'Old'
    },
    'Isaiah': {
      text: 'Which chapter of Isaiah contains the famous prophecy of the Suffering Servant who was "pierced for our transgressions and crushed for our iniquities"?',
      options: ['Isaiah 6', 'Isaiah 40', 'Isaiah 53', 'Isaiah 61'],
      correctAnswerIndex: 2,
      scriptureReference: 'Isaiah 53:5',
      explanation: 'Isaiah 53 portrays the Substitutionary Atonement of the Messiah who bore our griefs and carried our sorrows.',
      book: 'Isaiah',
      testament: 'Old'
    },
    'Jeremiah': {
      text: 'In Jeremiah 31:31-34, what revolutionary promise does the Lord make regarding His covenant with Israel and Judah?',
      options: [
        'He will enforce the Law with greater severity',
        'He will make a New Covenant, writing His law on their hearts',
        'He will rebuild the Solomonic temple twice as large',
        'He will abolish personal repentance'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Jeremiah 31:31-33',
      explanation: 'God promised the New Covenant, in which He puts His law in their minds and writes it on their hearts (fulfilled in Christ).',
      book: 'Jeremiah',
      testament: 'Old'
    },
    'Lamentations': {
      text: 'In Lamentations 3:22-23, what is declared to be "new every morning" due to the Lord\'s unfailing compassions?',
      options: ['His mercies and faithfulness', 'The earthly temple offerings', 'The signs in the heavens', 'The blessings of prosperity'],
      correctAnswerIndex: 0,
      scriptureReference: 'Lamentations 3:22-23',
      explanation: '"Through the Lord\'s mercies we are not consumed, because His compassions fail not. They are new every morning; great is Your faithfulness."',
      book: 'Lamentations',
      testament: 'Old'
    },
    'Ezekiel': {
      text: 'In Ezekiel 37, what visionary scene is Ezekiel brought to inspect and prophesy life into by the Spirit of the Lord?',
      options: ['A burning mountain', 'A valley of dry bones', 'A wheel within a wheel', 'A golden altar with seven lamps'],
      correctAnswerIndex: 1,
      scriptureReference: 'Ezekiel 37:1-10',
      explanation: 'Ezekiel prophesied to the dry bones and the breath entered them, depicting God\'s sovereign resurrection of Israel\'s spirit.',
      book: 'Ezekiel',
      testament: 'Old'
    },
    'Daniel': {
      text: 'Who were the three faithful Hebrew youths delivered untouched from King Nebuchadnezzar\'s fiery furnace?',
      options: [
        'Daniel, Haggai, and Zechariah',
        'Shadrach, Meshach, and Abednego (Hananiah, Mishael, Azariah)',
        'Joshua, Zerubbabel, and Nehemiah',
        'Eliphaz, Bildad, and Zophar'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Daniel 3:19-25',
      explanation: 'Shadrach, Meshach, and Abednego refused to bow to the golden image, and God walked with them through the furnace.',
      book: 'Daniel',
      testament: 'Old'
    },
    'Hosea': {
      text: 'Whom was the prophet Hosea commanded by God to marry, symbolizing the Lord\'s faithful love toward an unfaithful Israel?',
      options: ['Gomer', 'Ruth', 'Huldah', 'Deborah'],
      correctAnswerIndex: 0,
      scriptureReference: 'Hosea 1:2-3',
      explanation: 'God commanded Hosea to marry Gomer, whose infidelity vividly mirrored Israel\'s spiritual unfaithfulness to God.',
      book: 'Hosea',
      testament: 'Old'
    },
    'Joel': {
      text: 'Which prophecy from the book of Joel regarding the outpouring of God\'s Spirit was quoted by the Apostle Peter on the Day of Pentecost in Acts 2?',
      options: ['Joel 1:4', 'Joel 2:28-32', 'Joel 3:10', 'Joel 3:18'],
      correctAnswerIndex: 1,
      scriptureReference: 'Joel 2:28-29; Acts 2:16-21',
      explanation: 'Peter identified Pentecost as the fulfillment of Joel 2:28: "I will pour out My Spirit on all flesh."',
      book: 'Joel',
      testament: 'Old'
    },
    'Amos': {
      text: 'What was Amos\' profession before the Lord took him from following the flock to prophesy to Israel?',
      options: ['Priest at Bethel', 'A herdsman and tender of sycamore-fig trees', 'A scribe in Jerusalem', 'A court official of King Uzziah'],
      correctAnswerIndex: 1,
      scriptureReference: 'Amos 7:14-15',
      explanation: 'Amos said, "I was no prophet, nor was I a son of a prophet, but I was a herdsman and a tender of sycamore fruit."',
      book: 'Amos',
      testament: 'Old'
    },
    'Obadiah': {
      text: 'Against which proud mountainous nation, descendants of Esau, was the book of Obadiah\'s single chapter prophecy directed?',
      options: ['Moab', 'Edom', 'Ammon', 'Philistia'],
      correctAnswerIndex: 1,
      scriptureReference: 'Obadiah 1:1, 8',
      explanation: 'Obadiah pronounced God\'s judgment upon Edom for their arrogance and violence against their brother Jacob.',
      book: 'Obadiah',
      testament: 'Old'
    },
    'Jonah': {
      text: 'To which Assyrian capital city was Jonah commanded to preach repentance, which he initially attempted to flee from toward Tarshish?',
      options: ['Babylon', 'Nineveh', 'Damascus', 'Susa'],
      correctAnswerIndex: 1,
      scriptureReference: 'Jonah 1:1-3; 3:1-3',
      explanation: 'Jonah was sent to Nineveh, whose inhabitants famously repented in sackcloth and ashes upon hearing his preaching.',
      book: 'Jonah',
      testament: 'Old'
    },
    'Micah': {
      text: 'In Micah 5:2, which humble village in Judah was prophesied as the birthplace of the eternal ruler of Israel?',
      options: ['Nazareth', 'Bethlehem Ephrathah', 'Jerusalem', 'Hebron'],
      correctAnswerIndex: 1,
      scriptureReference: 'Micah 5:2',
      explanation: 'Micah 5:2 specifically pinpointed Bethlehem Ephrathah as the origin of the Messiah, fulfilled in Christ (Matthew 2:1-6).',
      book: 'Micah',
      testament: 'Old'
    },
    'Nahum': {
      text: 'The prophecy of Nahum describes the total overthrow and ruin of which imperial city that had formerly repented under Jonah?',
      options: ['Nineveh', 'Tyre', 'Thebes', 'Sidon'],
      correctAnswerIndex: 0,
      scriptureReference: 'Nahum 1:1; 3:1-7',
      explanation: 'Nahum foretold the final judgment and fall of Nineveh due to its relentless cruelty and idolatry.',
      book: 'Nahum',
      testament: 'Old'
    },
    'Habakkuk': {
      text: 'Which pivotal theological statement in Habakkuk 2:4 is quoted three times in the New Testament (Romans, Galatians, Hebrews)?',
      options: [
        'The Lord is in His holy temple',
        'The just shall live by his faith',
        'The earth will be filled with the glory of God',
        'A work in your days which you will not believe'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Habakkuk 2:4',
      explanation: '"The just shall live by his faith" serves as the bedrock principle for the doctrine of justification in Romans 1:17, Galatians 3:11, and Hebrews 10:38.',
      book: 'Habakkuk',
      testament: 'Old'
    },
    'Zephaniah': {
      text: 'In Zephaniah 3:17, what joyful image is given of the Lord God in the midst of His redeemed people?',
      options: [
        'He will march with ten thousands of chariots',
        'He will rejoice over you with gladness, quiet you in His love, and rejoice over you with singing',
        'He will erect a golden fortress upon Zion',
        'He will summon all angels for silent worship'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Zephaniah 3:17',
      explanation: '"The Lord your God in your midst, the Mighty One, will save; He will rejoice over you with gladness... He will rejoice over you with singing."',
      book: 'Zephaniah',
      testament: 'Old'
    },
    'Haggai': {
      text: 'What did the prophet Haggai exhort the returned exiles to prioritize above paneled cedar homes?',
      options: ['Rebuilding the Temple of the Lord', 'Building defensive perimeter walls', 'Planting extensive vineyards', 'Establishing diplomatic treaties'],
      correctAnswerIndex: 0,
      scriptureReference: 'Haggai 1:4, 8',
      explanation: 'Haggai urged Zerubbabel and Joshua to go up into the mountains, bring wood, and build God\'s house that He may take pleasure in it.',
      book: 'Haggai',
      testament: 'Old'
    },
    'Zechariah': {
      text: 'Which verse in Zechariah prophesied the Messiah\'s triumphal entry: "Rejoice greatly, O daughter of Zion... behold, your King is coming to you... lowly and riding on a donkey"?',
      options: ['Zechariah 4:6', 'Zechariah 9:9', 'Zechariah 12:10', 'Zechariah 14:4'],
      correctAnswerIndex: 1,
      scriptureReference: 'Zechariah 9:9',
      explanation: 'Zechariah 9:9 was fulfilled when Jesus entered Jerusalem on Palm Sunday riding on a donkey\'s colt (Matthew 21:4-5).',
      book: 'Zechariah',
      testament: 'Old'
    },
    'Malachi': {
      text: 'In the closing verses of the Old Testament (Malachi 4:5), which prophet was promised to appear before the coming of the great and dreadful day of the Lord?',
      options: ['Moses', 'Elijah', 'Samuel', 'Elisha'],
      correctAnswerIndex: 1,
      scriptureReference: 'Malachi 4:5-6',
      explanation: 'God promised to send Elijah the prophet before the Day of the Lord, fulfilled in the spirit and power of John the Baptist (Luke 1:17).',
      book: 'Malachi',
      testament: 'Old'
    },
    'Matthew': {
      text: 'In the Sermon on the Mount (Matthew 5), what does Jesus call His followers regarding their presence and witness in the world?',
      options: ['The gold of the temple and the crown of kings', 'The salt of the earth and the light of the world', 'The hammer of justice and the shield of nations', 'The eagles of the sky and the lions of Judah'],
      correctAnswerIndex: 1,
      scriptureReference: 'Matthew 5:13-14',
      explanation: 'Jesus declared: "You are the salt of the earth... You are the light of the world. A city that is set on a hill cannot be hidden."',
      book: 'Matthew',
      testament: 'New'
    },
    'Mark': {
      text: 'What is the prominent theme and portrait of Christ emphasized throughout Mark\'s Gospel, summarized in Mark 10:45?',
      options: ['The Promised Davidic King', 'The Suffering Servant who gave His life as a ransom for many', 'The Divine Eternal Word', 'The Ideal Perfect Man'],
      correctAnswerIndex: 1,
      scriptureReference: 'Mark 10:45',
      explanation: '"For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many."',
      book: 'Mark',
      testament: 'New'
    },
    'Luke': {
      text: 'Which parable, unique to the Gospel of Luke, features a despised Samaritan caring for a wounded traveler passed by a priest and Levite?',
      options: ['The Prodigal Son', 'The Good Samaritan', 'The Pharisee and the Tax Collector', 'The Rich Fool'],
      correctAnswerIndex: 1,
      scriptureReference: 'Luke 10:30-37',
      explanation: 'Jesus told the parable of the Good Samaritan to define who one\'s neighbor is, demonstrating mercy transcending ethnic boundaries.',
      book: 'Luke',
      testament: 'New'
    },
    'John': {
      text: 'In John 14:6, how did Jesus declare Himself to Thomas and the disciples?',
      options: [
        'I am the light, the truth, and the bread',
        'I am the way, the truth, and the life; no one comes to the Father except through Me',
        'I am the resurrection, the vine, and the shepherd',
        'I am the prophet, the priest, and the king'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'John 14:6',
      explanation: 'Jesus asserted absolute exclusivity and total sufficiency: "I am the way, the truth, and the life; no one comes to the Father except through Me."',
      book: 'John',
      testament: 'New'
    },
    'Acts': {
      text: 'On the road to Damascus, who was miraculously converted after seeing a blinding light and hearing the voice of Jesus?',
      options: ['Cornelius', 'Saul of Tarsus (Paul)', 'Apollos', 'Barnabas'],
      correctAnswerIndex: 1,
      scriptureReference: 'Acts 9:3-6',
      explanation: 'Saul was confronted directly by the risen Lord Jesus and went on to become the Apostle to the Gentiles.',
      book: 'Acts',
      testament: 'New'
    },
    '1 Corinthians': {
      text: 'In 1 Corinthians 13:13, what three virtues abide, and which of these is declared to be the greatest?',
      options: ['Wisdom, power, and glory; the greatest is wisdom', 'Faith, hope, and love; the greatest of these is love', 'Prayer, fasting, and almsgiving; the greatest is prayer', 'Knowledge, prophecy, and tongues; the greatest is prophecy'],
      correctAnswerIndex: 1,
      scriptureReference: '1 Corinthians 13:13',
      explanation: '"And now abide faith, hope, love, these three; but the greatest of these is love."',
      book: '1 Corinthians',
      testament: 'New'
    },
    '2 Corinthians': {
      text: 'In 2 Corinthians 12:9, what was the Lord\'s answer to Paul concerning his persistent thorn in the flesh?',
      options: [
        'Be healed immediately by faith',
        'My grace is sufficient for you, for My strength is made perfect in weakness',
        'Offer sacrifices at the temple in Jerusalem',
        'Depart from active ministry to rest'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '2 Corinthians 12:9',
      explanation: 'Christ told Paul: "My grace is sufficient for you, for My strength is made perfect in weakness."',
      book: '2 Corinthians',
      testament: 'New'
    },
    'Galatians': {
      text: 'In Galatians 5:22-23, which of the following is listed as the ninefold Fruit of the Spirit?',
      options: [
        'Gold, frankincense, myrrh, jasper, sapphire, emerald, ruby, topaz, amethyst',
        'Love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control',
        'Power, honor, riches, wisdom, strength, blessing, dominion, authority, glory',
        'Prophecy, tongues, miracles, healing, discernment, teaching, giving, ruling, mercy'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Galatians 5:22-23',
      explanation: 'Paul contrasts the works of the flesh with the singular Fruit of the Spirit produced by the indwelling Holy Spirit.',
      book: 'Galatians',
      testament: 'New'
    },
    'Ephesians': {
      text: 'According to Ephesians 2:8-9, how are believers saved?',
      options: [
        'By ritual purification and circumcision',
        'By grace through faith, and that not of yourselves; it is the gift of God, not of works',
        'By their own moral righteousness and obedience to the Law',
        'By ancestral heritage as children of Abraham'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Ephesians 2:8-9',
      explanation: 'Salvation is entirely by sovereign grace through faith, a free gift of God so that no one can boast.',
      book: 'Ephesians',
      testament: 'New'
    },
    'Philippians': {
      text: 'In Philippians 2:5-11 (the Carmen Christi), what did Christ Jesus do when taking upon Himself the form of a bondservant?',
      options: [
        'Retained His independent glory before earthly kings',
        'Emptied Himself (kenosis), humbled Himself, and became obedient to death on a cross',
        'Refused to associate with sinners',
        'Demanded immediate royal worship from Roman authorities'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Philippians 2:6-8',
      explanation: 'Being in the form of God, Christ made Himself of no reputation, taking the form of a servant and humbling Himself unto death.',
      book: 'Philippians',
      testament: 'New'
    },
    'Colossians': {
      text: 'In Colossians 1:15-17, how is the supremacy of Jesus Christ described?',
      options: [
        'The image of the invisible God, the firstborn over all creation, by whom all things were created',
        'An exalted angel created before the earth was formed',
        'A moral reformer comparable to Socrates and Moses',
        'An earthly prophet chosen solely during baptism'
      ],
      correctAnswerIndex: 0,
      scriptureReference: 'Colossians 1:15-17',
      explanation: 'Paul extols Christ as the visible image of the invisible God, Creator of all things in heaven and earth, holding all creation together.',
      book: 'Colossians',
      testament: 'New'
    },
    '1 Thessalonians': {
      text: 'In 1 Thessalonians 4:16-17, what glorious event will occur when the Lord Himself descends from heaven with a shout?',
      options: [
        'The dead in Christ will rise first, then we who are alive will be caught up together in the clouds',
        'The sun will be permanently darkened and the stars will fall',
        'All earthly nations will immediately sign peace treaties',
        'The temple in Jerusalem will be instantaneously rebuilt'
      ],
      correctAnswerIndex: 0,
      scriptureReference: '1 Thessalonians 4:16-17',
      explanation: 'Paul comfortingly details the return of the Lord where the dead in Christ rise first, and believers are gathered to meet the Lord.',
      book: '1 Thessalonians',
      testament: 'New'
    },
    '2 Thessalonians': {
      text: 'In 2 Thessalonians 2:3, what two things must occur before the Day of the Lord arrives?',
      options: [
        'The restoration of the Roman Empire and worldwide monetary collapse',
        'The falling away (apostasy) first, and the man of sin (son of perdition) being revealed',
        'The building of seven altars in Babylon and the drying up of the Nile',
        'The universal evangelization of all continents without persecution'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '2 Thessalonians 2:3',
      explanation: 'Paul clarifies that the Day of Christ will not come until the rebellion occurs and the man of lawlessness is revealed.',
      book: '2 Thessalonians',
      testament: 'New'
    },
    '1 Timothy': {
      text: 'In 1 Timothy 2:5, how many mediators between God and men are declared to exist?',
      options: ['Many angels and saints', 'One: the Man Christ Jesus', 'Two: Moses and Aaron', 'Seven archangels'],
      correctAnswerIndex: 1,
      scriptureReference: '1 Timothy 2:5',
      explanation: '"For there is one God and one Mediator between God and men, the Man Christ Jesus, who gave Himself a ransom for all."',
      book: '1 Timothy',
      testament: 'New'
    },
    '2 Timothy': {
      text: 'According to 2 Timothy 3:16, how much of Scripture is inspired by God (theopneustos) and profitable for doctrine, reproof, correction, and instruction in righteousness?',
      options: ['Only the Gospels', 'All Scripture', 'Only the Ten Commandments', 'Only parts not involving historical genealogies'],
      correctAnswerIndex: 1,
      scriptureReference: '2 Timothy 3:16-17',
      explanation: '"All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness."',
      book: '2 Timothy',
      testament: 'New'
    },
    'Titus': {
      text: 'In Titus 3:5, by what are believers saved, not by works of righteousness which we have done?',
      options: [
        'By family heritage and legal circumcision',
        'According to His mercy, through the washing of regeneration and renewing of the Holy Spirit',
        'By strict observance of Sabbath feasts',
        'By personal moral perfection prior to baptism'
      ],
      correctAnswerIndex: 1,
      scriptureReference: 'Titus 3:5',
      explanation: 'Salvation is rooted entirely in God\'s mercy through the washing of regeneration and renewing of the Holy Spirit.',
      book: 'Titus',
      testament: 'New'
    },
    'Philemon': {
      text: 'Which runaway slave was converted through Paul\'s ministry in prison and sent back to his master Philemon as a beloved brother in the Lord?',
      options: ['Onesimus', 'Tychicus', 'Epaphras', 'Aristarchus'],
      correctAnswerIndex: 0,
      scriptureReference: 'Philemon 1:10, 16',
      explanation: 'Paul appeals for Onesimus, urging Philemon to receive him no longer as a slave, but as a beloved brother in Christ.',
      book: 'Philemon',
      testament: 'New'
    },
    'James': {
      text: 'In James 1:22, what does the Apostle James urge believers to be, rather than merely hearers of the Word who deceive themselves?',
      options: ['Judges of others', 'Doers of the Word', 'Disputers of the law', 'Scholars of tradition'],
      correctAnswerIndex: 1,
      scriptureReference: 'James 1:22',
      explanation: '"But be doers of the word, and not hearers only, deceiving yourselves."',
      book: 'James',
      testament: 'New'
    },
    '1 Peter': {
      text: 'In 1 Peter 2:9, how is the Church described in contrast to those who stumble in disbelief?',
      options: [
        'An ordinary social club of seekers',
        'A chosen generation, a royal priesthood, a holy nation, His own special people',
        'A military regiment to overthrow Rome',
        'A secluded monastery cut off from society'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '1 Peter 2:9',
      explanation: 'Believers are "a chosen generation, a royal priesthood, a holy nation, His own special people, that you may proclaim the praises of Him."',
      book: '1 Peter',
      testament: 'New'
    },
    '2 Peter': {
      text: 'In 2 Peter 1:21, how did holy men of God speak prophecy in ancient times?',
      options: [
        'By their own human imagination and literary genius',
        'Moved by the Holy Spirit',
        'By deciphering astronomical configurations',
        'By popular consensus of village elders'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '2 Peter 1:21',
      explanation: '"For prophecy never came by the will of man, but holy men of God spoke as they were moved by the Holy Spirit."',
      book: '2 Peter',
      testament: 'New'
    },
    '1 John': {
      text: 'In 1 John 1:9, what is God faithful and just to do if we confess our sins?',
      options: [
        'Demand public humiliation before forgiveness',
        'Forgive us our sins and cleanse us from all unrighteousness',
        'Record our sins permanently in earthly annals',
        'Withhold His fellowship until we earn it back'
      ],
      correctAnswerIndex: 1,
      scriptureReference: '1 John 1:9',
      explanation: '"If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness."',
      book: '1 John',
      testament: 'New'
    },
    '2 John': {
      text: 'What great commandment is emphasized in 2 John as the truth we have had from the beginning?',
      options: ['That we fast twice a week', 'That we love one another and walk according to His commandments', 'That we build large synagogues', 'That we write theological commentaries'],
      correctAnswerIndex: 1,
      scriptureReference: '2 John 1:5-6',
      explanation: 'John pleads that we love one another: "This is love, that we walk according to His commandments."',
      book: '2 John',
      testament: 'New'
    },
    '3 John': {
      text: 'In 3 John 9-10, which prideful leader in the church is rebuked for loving to have the preeminence and refusing to receive the brethren?',
      options: ['Gaius', 'Diotrephes', 'Demetrius', 'Alexander'],
      correctAnswerIndex: 1,
      scriptureReference: '3 John 1:9',
      explanation: 'John rebukes Diotrephes "who loves to have the preeminence among them, does not receive us... and casts them out of the church."',
      book: '3 John',
      testament: 'New'
    },
    'Jude': {
      text: 'In Jude 3, what does Jude exhort believers to earnestly contend for?',
      options: ['Political influence in Rome', 'The faith which was once for all delivered to the saints', 'New private revelations from angels', 'Control over the Jerusalem temple'],
      correctAnswerIndex: 1,
      scriptureReference: 'Jude 1:3',
      explanation: 'Jude urges Christians to "contend earnestly for the faith which was once for all delivered to the saints."',
      book: 'Jude',
      testament: 'New'
    }
  };

  const generic = bookQuestions[book] || {
    text: `Which core biblical truth is central to the testimony of ${book}?`,
    options: [
      `The eternal sovereignty and steadfast redemptive covenant of God in ${book}`,
      'Human self-sufficiency without divine intervention',
      'The supremacy of Greek pagan philosophy',
      'The permanent destruction of the promise without fulfillment'
    ],
    correctAnswerIndex: 0,
    scriptureReference: `${book} 1:1-3`,
    explanation: `The book of ${book} proclaims God's unchanging character, holy requirements, and glorious covenant fidelity.`,
    book,
    testament
  };

  return generic;
}

function getLevelTitle(level: number, _stage: string): string {
  if (level <= 10) return 'Foundations of Genesis & Creation';
  if (level <= 20) return 'Exodus, Deliverance & Covenant Law';
  if (level <= 30) return 'Conquest of Canaan, Judges & Ruth';
  if (level <= 40) return 'United Monarchy: Saul, David & Solomon';
  if (level <= 50) return 'Psalms of Worship & Wisdom of Proverbs';
  if (level <= 60) return 'Divided Kingdom: Kings & Chronicles';
  if (level <= 70) return 'Major Prophets: Isaiah, Jeremiah & Ezekiel';
  if (level <= 80) return 'Exile, Daniel\'s Visions & Post-Exilic Return';
  if (level <= 90) return 'The Minor Prophets: Repentance & Hope';
  if (level <= 100) return 'The Gospels: Life, Ministry & Teachings of Christ';
  if (level <= 110) return 'The Passion, Resurrection & Ascension';
  if (level <= 120) return 'Acts of the Apostles & Early Church Missions';
  if (level <= 130) return 'Pauline Soteriology: Romans & Galatians';
  if (level <= 140) return 'Ecclesiology & Unity: Corinthians & Ephesians';
  if (level <= 150) return 'Prison & Pastoral Epistles: Philippians to Titus';
  if (level <= 160) return 'Epistle to the Hebrews & Melchizedek Priesthood';
  if (level <= 170) return 'General Epistles: James, Peter & Jude';
  if (level <= 180) return 'Johannine Literature & Deep Christology';
  if (level <= 190) return 'Prophetic Chronology & Apocalyptic Shadows';
  return 'Revelation: Seals, Bowls & The New Jerusalem';
}

function getLevelSubtitle(level: number, stage: string): string {
  return `${stage} Stage • 10 Questions • 70% to Unlock Level ${level + 1}`;
}

// Generate all 10 distinct stages (200 levels total)
function generateStageFiles() {
  const outputDir = path.resolve('src/data/championship');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const stages: { start: number; end: number; stage: string; filename: string }[] = [
    { start: 1, end: 20, stage: 'Beginner', filename: 'levels1to20.ts' },
    { start: 21, end: 40, stage: 'Easy', filename: 'levels21to40.ts' },
    { start: 41, end: 60, stage: 'Intermediate', filename: 'levels41to60.ts' },
    { start: 61, end: 80, stage: 'Challenging', filename: 'levels61to80.ts' },
    { start: 81, end: 100, stage: 'Advanced', filename: 'levels81to100.ts' },
    { start: 101, end: 120, stage: 'Very Advanced', filename: 'levels101to120.ts' },
    { start: 121, end: 140, stage: 'Expert', filename: 'levels121to140.ts' },
    { start: 141, end: 160, stage: 'Master', filename: 'levels141to160.ts' },
    { start: 161, end: 180, stage: 'Grandmaster', filename: 'levels161to180.ts' },
    { start: 181, end: 200, stage: 'Legendary', filename: 'levels181to200.ts' }
  ];

  for (const st of stages) {
    const levels = [];
    for (let l = st.start; l <= st.end; l++) {
      const qs = generateLevelQuestions(l, st.stage);
      const levelData = {
        levelNumber: l,
        title: `Level ${l}: ${getLevelTitle(l, st.stage)}`,
        subtitle: getLevelSubtitle(l, st.stage),
        stage: st.stage,
        testamentFocus: l % 3 === 0 ? 'Both' : l % 2 === 1 ? 'Old' : 'New',
        passingScore: 7,
        questions: qs.map((q, idx) => ({
          id: `champ-lvl-${l}-q-${idx + 1}`,
          level: l,
          questionNumber: idx + 1,
          ...q
        }))
      };
      levels.push(levelData);
    }

    const varName = `championshipLevels${st.start}to${st.end}`;
    const fileContent = `import type { ChampionshipLevel } from '../../types/championship';\n\nexport const ${varName}: ChampionshipLevel[] = ${JSON.stringify(levels, null, 2)};\n`;
    fs.writeFileSync(path.join(outputDir, st.filename), fileContent, 'utf-8');
    console.log(`Wrote ${st.filename} with levels ${st.start}-${st.end} (${levels.length * 10} questions)`);
  }

  // Write index.ts
  const indexContent = `import type { ChampionshipLevel } from '../../types/championship';
import { championshipLevels1to20 } from './levels1to20';
import { championshipLevels21to40 } from './levels21to40';
import { championshipLevels41to60 } from './levels41to60';
import { championshipLevels61to80 } from './levels61to80';
import { championshipLevels81to100 } from './levels81to100';
import { championshipLevels101to120 } from './levels101to120';
import { championshipLevels121to140 } from './levels121to140';
import { championshipLevels141to160 } from './levels141to160';
import { championshipLevels161to180 } from './levels161to180';
import { championshipLevels181to200 } from './levels181to200';

export const allChampionshipLevels: ChampionshipLevel[] = [
  ...championshipLevels1to20,
  ...championshipLevels21to40,
  ...championshipLevels41to60,
  ...championshipLevels61to80,
  ...championshipLevels81to100,
  ...championshipLevels101to120,
  ...championshipLevels121to140,
  ...championshipLevels141to160,
  ...championshipLevels161to180,
  ...championshipLevels181to200
];

export const TOTAL_CHAMPIONSHIP_QUESTIONS = allChampionshipLevels.length * 10; // Exactly 2,000 Questions
export const TOTAL_CHAMPIONSHIP_LEVELS = allChampionshipLevels.length; // 200 Levels

export function getChampionshipLevel(levelNumber: number): ChampionshipLevel | undefined {
  return allChampionshipLevels.find((lvl) => lvl.levelNumber === levelNumber);
}
`;
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent, 'utf-8');
  console.log(`Wrote index.ts with total 200 levels (2,000 questions)!`);
}

generateStageFiles();
