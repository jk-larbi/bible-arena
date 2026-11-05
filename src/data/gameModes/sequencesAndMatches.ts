// ============================================================================
// BIBLEARENA SEQUENCES & CHARACTER MATCH DATA BANK
// 70 Chronological Sequences & Relational Match Combinations across 10 Stages
// ============================================================================

export interface SequenceDataEntry {
  levelGroup: number;
  prompt: string;
  items: { id: string; text: string; correctOrder: number }[];
  reference: string;
  explanation: string;
}

export interface CharacterMatchDataEntry {
  levelGroup: number;
  title: string;
  pairs: { id: string; left: string; right: string }[];
  reference: string;
  explanation: string;
}

export const CHRONOLOGICAL_SEQUENCES_BANK: SequenceDataEntry[] = [
  // --- STAGE 1: BEGINNER (Levels 1–10) ---
  {
    levelGroup: 1,
    prompt: 'Arrange these foundational Patriarchs in order of biological descent:',
    items: [
      { id: 'p1', text: 'Abraham (Father of Faith)', correctOrder: 1 },
      { id: 'p2', text: 'Isaac (Son of Promise)', correctOrder: 2 },
      { id: 'p3', text: 'Jacob (Father of the 12 Tribes)', correctOrder: 3 },
      { id: 'p4', text: 'Joseph (Ruler in Egypt)', correctOrder: 4 },
    ],
    reference: 'Genesis 12-50',
    explanation: 'The patriarchal lineage unfolds: Abraham begot Isaac, Isaac begot Jacob, and Jacob begot Joseph.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these pivotal Exodus events in chronological sequence:',
    items: [
      { id: 'e1', text: 'Moses and the Burning Bush at Mount Horeb', correctOrder: 1 },
      { id: 'e2', text: 'The Ten Plagues Unleashed on Egypt', correctOrder: 2 },
      { id: 'e3', text: 'The Parting of the Red Sea', correctOrder: 3 },
      { id: 'e4', text: 'Giving of the Ten Commandments at Mount Sinai', correctOrder: 4 },
    ],
    reference: 'Exodus 3-20',
    explanation: 'God commissioned Moses, judged Egypt’s false gods, delivered Israel through the sea, and established the covenant at Sinai.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these kings of the United Monarchy in order of their coronation:',
    items: [
      { id: 'k1', text: 'Saul (The First Anointed King)', correctOrder: 1 },
      { id: 'k2', text: 'David (The Shepherd King of Judah)', correctOrder: 2 },
      { id: 'k3', text: 'Solomon (The Wise Temple Builder)', correctOrder: 3 },
      { id: 'k4', text: 'Rehoboam (King when the Kingdom Fractured)', correctOrder: 4 },
    ],
    reference: '1 Samuel 10 to 1 Kings 12',
    explanation: 'Saul was followed by David, then Solomon, after whose death Rehoboam’s pride split the kingdom in 931 BC.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these milestones in the early life of Jesus Christ in order:',
    items: [
      { id: 'j1', text: 'Annunciation to Mary in Nazareth', correctOrder: 1 },
      { id: 'j2', text: 'Birth in the Manger in Bethlehem', correctOrder: 2 },
      { id: 'j3', text: 'Visit of the Magi from the East', correctOrder: 3 },
      { id: 'j4', text: 'Boy Jesus in the Temple at Age 12', correctOrder: 4 },
    ],
    reference: 'Matthew 1-2; Luke 1-2',
    explanation: 'The Incarnation narrative moves from Gabriel’s announcement to the Nativity, the Magi’s gifts, and temple dialogue.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these major events of Holy Week in historical order:',
    items: [
      { id: 'h1', text: 'Triumphal Entry on Palm Sunday', correctOrder: 1 },
      { id: 'h2', text: 'The Last Supper in the Upper Room', correctOrder: 2 },
      { id: 'h3', text: 'Agony in Gethsemane and Arrest', correctOrder: 3 },
      { id: 'h4', text: 'Crucifixion at Golgotha on Good Friday', correctOrder: 4 },
    ],
    reference: 'The Four Gospels',
    explanation: 'Palm Sunday arrival was followed by Passover institution, nighttime Gethsemane betrayal, and Friday’s crucifixion.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these post-crucifixion events in chronological sequence:',
    items: [
      { id: 'r1', text: 'Burial in Joseph of Arimathea’s Tomb', correctOrder: 1 },
      { id: 'r2', text: 'Resurrection and Empty Tomb on the 3rd Day', correctOrder: 2 },
      { id: 'r3', text: 'Ascension into Heaven from Mount Olivet', correctOrder: 3 },
      { id: 'r4', text: 'Outpouring of the Holy Spirit at Pentecost', correctOrder: 4 },
    ],
    reference: 'Luke 23-24; Acts 1-2',
    explanation: 'Burial preceded third-day resurrection, 40 days of post-resurrection appearances, Ascension, and Day of Pentecost.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these creation events from Genesis 1 in chronological sequence:',
    items: [
      { id: 'c1', text: 'Day 1: "Let there be light"', correctOrder: 1 },
      { id: 'c2', text: 'Day 3: Dry land, seas, and vegetation', correctOrder: 2 },
      { id: 'c3', text: 'Day 4: Sun, moon, and stars', correctOrder: 3 },
      { id: 'c4', text: 'Day 6: Land animals and humanity in God’s image', correctOrder: 4 },
    ],
    reference: 'Genesis 1',
    explanation: 'Creation moves from forming light and cosmic realms to populating celestial luminaries and crowning humanity.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these milestones of Abraham’s journey of faith:',
    items: [
      { id: 'a1', text: 'Departure from Ur and Haran to Canaan', correctOrder: 1 },
      { id: 'a2', text: 'Covenant of the Pieces with the Smoking Oven', correctOrder: 2 },
      { id: 'a3', text: 'Birth of Isaac to Sarah at Age 90', correctOrder: 3 },
      { id: 'a4', text: 'Offering of Isaac on Mount Moriah', correctOrder: 4 },
    ],
    reference: 'Genesis 12, 15, 21, 22',
    explanation: 'Abraham left Mesopotamia, received covenant assurance, saw miraculous Isaac born, and was tested at Moriah.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these events in the life of young David:',
    items: [
      { id: 'd1', text: 'Tending father Jesse’s sheep in Bethlehem', correctOrder: 1 },
      { id: 'd2', text: 'Anointed secretly with oil by Samuel', correctOrder: 2 },
      { id: 'd3', text: 'Playing the harp to soothe King Saul', correctOrder: 3 },
      { id: 'd4', text: 'Slaying Goliath with a sling and stone', correctOrder: 4 },
    ],
    reference: '1 Samuel 16-17',
    explanation: 'From the sheepfold to secret coronation, court minstrel, and heroic victory over the Philistine champion.',
  },
  {
    levelGroup: 1,
    prompt: 'Arrange these milestones in the early expansion of the Church in Acts:',
    items: [
      { id: 'ac1', text: 'Outpouring of the Holy Spirit at Pentecost', correctOrder: 1 },
      { id: 'ac2', text: 'Healing of the Lame Man at the Beautiful Gate', correctOrder: 2 },
      { id: 'ac3', text: 'Martyrdom of Stephen outside Jerusalem', correctOrder: 3 },
      { id: 'ac4', text: 'Conversion of Saul on the Damascus Road', correctOrder: 4 },
    ],
    reference: 'Acts 2, 3, 7, 9',
    explanation: 'Pentecost led to public apostolic signs, intense Jewish persecution, Stephen’s martyrdom, and Saul’s turnaround.',
  },

  // --- STAGE 2: EASY (Levels 11–20) ---
  {
    levelGroup: 2,
    prompt: 'Arrange these ancient judges of Israel in chronological order:',
    items: [
      { id: 'j1', text: 'Othniel (First Judge of Israel)', correctOrder: 1 },
      { id: 'j2', text: 'Deborah and Barak (Victory at Mount Tabor)', correctOrder: 2 },
      { id: 'j3', text: 'Gideon (Victory over Midian with 300 men)', correctOrder: 3 },
      { id: 'j4', text: 'Samson (Judge who fought the Philistines)', correctOrder: 4 },
    ],
    reference: 'Book of Judges',
    explanation: 'The era of the judges cycled from Othniel to Deborah, Gideon, Jephthah, and Samson before Samuel.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these events in the life of Moses after the Exodus:',
    items: [
      { id: 'm1', text: 'Bitter waters sweetened at Marah', correctOrder: 1 },
      { id: 'm2', text: 'Battle with Amalek at Rephidim (Hur and Aaron holding hands)', correctOrder: 2 },
      { id: 'm3', text: 'The Golden Calf and shattering of the first tablets', correctOrder: 3 },
      { id: 'm4', text: 'Viewing the Promised Land from Mount Nebo', correctOrder: 4 },
    ],
    reference: 'Exodus 15, 17, 32; Deuteronomy 34',
    explanation: 'The wilderness wanderings moved from water miracles to the Sinai apostasy and Moses’ death atop Mount Nebo.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these events in the life of Joseph in Egypt in sequence:',
    items: [
      { id: 'jo1', text: 'Sold into slavery in Potiphar’s household', correctOrder: 1 },
      { id: 'jo2', text: 'Interpreting the baker and cupbearer’s dreams in prison', correctOrder: 2 },
      { id: 'jo3', text: 'Interpreting Pharaoh’s dream of seven lean cows', correctOrder: 3 },
      { id: 'jo4', text: 'Reuniting with Jacob and settling Israel in Goshen', correctOrder: 4 },
    ],
    reference: 'Genesis 39, 40, 41, 46',
    explanation: 'Joseph’s journey progressed through Potiphar’s house, royal prison, prime ministry, and covenant family rescue.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these events from Elijah’s prophetic ministry:',
    items: [
      { id: 'el1', text: 'Fed by ravens with bread and meat at Brook Cherith', correctOrder: 1 },
      { id: 'el2', text: 'Raising the son of the widow of Zarephath', correctOrder: 2 },
      { id: 'el3', text: 'Fire falling on Mount Carmel against prophets of Baal', correctOrder: 3 },
      { id: 'el4', text: 'Hearing the "still small voice" at Mount Horeb', correctOrder: 4 },
    ],
    reference: '1 Kings 17-19',
    explanation: 'Cherith wilderness provision preceded the Zarephath resurrection, Carmel contest, and Horeb whisper.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these key miracles performed by Jesus Christ in the Gospels:',
    items: [
      { id: 'mi1', text: 'Water turned into wine at the Cana wedding feast', correctOrder: 1 },
      { id: 'mi2', text: 'Calming the storm on the Sea of Galilee', correctOrder: 2 },
      { id: 'mi3', text: 'Feeding of the 5,000 with 5 loaves and 2 fish', correctOrder: 3 },
      { id: 'mi4', text: 'Raising Lazarus from the dead at Bethany', correctOrder: 4 },
    ],
    reference: 'John 2, 6, 11; Mark 4',
    explanation: 'From the inaugural sign at Cana to nature miracles, multiplication, and the climatic raising of Lazarus.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these events in the historical book of Esther in sequence:',
    items: [
      { id: 'es1', text: 'Queen Vashti deposed by King Ahasuerus', correctOrder: 1 },
      { id: 'es2', text: 'Esther crowned queen of Persia in Susa', correctOrder: 2 },
      { id: 'es3', text: 'Haman casting Pur to annihilate the Jewish people', correctOrder: 3 },
      { id: 'es4', text: 'Institution of the Feast of Purim to celebrate deliverance', correctOrder: 4 },
    ],
    reference: 'Book of Esther',
    explanation: 'Vashti’s refusal opened the throne for Esther, whose intervention crushed Haman and birthed Purim.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these biblical covenant inaugurations in biblical chronology:',
    items: [
      { id: 'co1', text: 'Adamic / Edenic Covenant of Life', correctOrder: 1 },
      { id: 'co2', text: 'Noahic Covenant with the Rainbow', correctOrder: 2 },
      { id: 'co3', text: 'Abrahamic Covenant of Circumcision and Land', correctOrder: 3 },
      { id: 'co4', text: 'Mosaic Covenant on Stone Tablets at Sinai', correctOrder: 4 },
    ],
    reference: 'Genesis 2, 9, 15; Exodus 20',
    explanation: 'The covenant framework progresses through Adam, Noah, Abraham, and Moses leading to the Davidic and New Covenants.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these conquests and milestones in Joshua’s conquest of Canaan:',
    items: [
      { id: 'jo1', text: 'Spies hidden by Rahab in Jericho', correctOrder: 1 },
      { id: 'jo2', text: 'Crossing the Jordan River at flood stage', correctOrder: 2 },
      { id: 'jo3', text: 'The fall of the walls of Jericho', correctOrder: 3 },
      { id: 'jo4', text: 'The conquest of Ai after uncovering Achan’s sin', correctOrder: 4 },
    ],
    reference: 'Joshua 2, 3, 6, 8',
    explanation: 'Rahab’s espionage prepared for the Jordan crossing, the miraculous collapse of Jericho, and the capture of Ai.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these kingdoms that ruled over the Jewish people in historical sequence:',
    items: [
      { id: 'emp1', text: 'Egyptian Bondage (Pharaohs of the Nile)', correctOrder: 1 },
      { id: 'emp2', text: 'Babylonian Empire (Nebuchadnezzar)', correctOrder: 2 },
      { id: 'emp3', text: 'Medo-Persian Empire (Cyrus and Darius)', correctOrder: 3 },
      { id: 'emp4', text: 'Roman Empire (Caesar Augustus and Tiberius)', correctOrder: 4 },
    ],
    reference: 'Biblical History & Daniel 2',
    explanation: 'Israel experienced bondage under Egypt, exile under Babylon, restoration under Persia, and Roman rule in Christ’s era.',
  },
  {
    levelGroup: 2,
    prompt: 'Arrange these events from the missionary journeys of Apostle Paul in order:',
    items: [
      { id: 'pau1', text: 'Commissioned with Barnabas from Antioch (1st Journey)', correctOrder: 1 },
      { id: 'pau2', text: 'Jerusalem Council resolving Gentile circumcision (Acts 15)', correctOrder: 2 },
      { id: 'pau3', text: 'Philippian Jail earthquake at midnight (2nd Journey)', correctOrder: 3 },
      { id: 'pau4', text: 'Shipwreck at Malta on the way to Rome (Acts 27-28)', correctOrder: 4 },
    ],
    reference: 'Acts 13, 15, 16, 27',
    explanation: 'First journey evangelism preceded the apostolic Jerusalem Council, Philippian church plant, and Roman voyage.',
  },
];

export const CHARACTER_MATCH_BANK: CharacterMatchDataEntry[] = [
  // --- STAGE 1: BEGINNER (Levels 1–10) ---
  {
    levelGroup: 1,
    title: 'Biblical Figures and Their Great Deeds',
    pairs: [
      { id: 'm1', left: 'Moses', right: 'Parted the Red Sea with his staff' },
      { id: 'm2', left: 'David', right: 'Defeated Goliath in the Valley of Elah' },
      { id: 'm3', left: 'Noah', right: 'Constructed the ark through divine instructions' },
      { id: 'm4', left: 'Daniel', right: 'Survived the den of hungry Persian lions' },
    ],
    reference: 'Exodus 14; 1 Samuel 17; Genesis 6; Daniel 6',
    explanation: 'Each legendary Old Testament figure exercised courage to display Yahweh’s sovereign power.',
  },
  {
    levelGroup: 1,
    title: 'Apostles and Their Distinguishing Callings',
    pairs: [
      { id: 'a1', left: 'Simon Peter', right: 'Preached the Pentecost sermon where 3,000 were saved' },
      { id: 'a2', left: 'John the Beloved', right: 'Received the apocalyptic visions on Patmos' },
      { id: 'a3', left: 'Matthew (Levi)', right: 'Tax collector who left his booth to follow Jesus' },
      { id: 'a4', left: 'Thomas (Didymus)', right: 'Demanded to see nail prints before confessing faith' },
    ],
    reference: 'The Four Gospels and Acts',
    explanation: 'The Twelve Apostles reflected diverse backgrounds transformed into pillars of the Church.',
  },
  {
    levelGroup: 1,
    title: 'Famous Biblical Husbands and Wives',
    pairs: [
      { id: 'h1', left: 'Abraham', right: 'Sarah (Mother of Isaac)' },
      { id: 'h2', left: 'Isaac', right: 'Rebekah (Met at the desert well)' },
      { id: 'h3', left: 'Jacob', right: 'Rachel (Beloved wife served 14 years)' },
      { id: 'h4', left: 'Boaz', right: 'Ruth (The loyal Moabitess)' },
    ],
    reference: 'Genesis 17, 24, 29; Ruth 4',
    explanation: 'The patriarchal and royal couples through whom God channeled the Messianic promises.',
  },
  {
    levelGroup: 1,
    title: 'Prophets and Their Major Visual Signs',
    pairs: [
      { id: 'pr1', left: 'Elijah', right: 'Called down divine fire on Mount Carmel' },
      { id: 'pr2', left: 'Elisha', right: 'Parted the Jordan with Elijah’s fallen mantle' },
      { id: 'pr3', left: 'Ezekiel', right: 'Saw the valley of dry bones come to life' },
      { id: 'pr4', left: 'Jonah', right: 'Preserved three days in the belly of a great fish' },
    ],
    reference: '1 Kings 18; 2 Kings 2; Ezekiel 37; Jonah 1-2',
    explanation: 'Prophets confirmed their divine commission through dramatic visual signs and prophecies.',
  },
  {
    levelGroup: 1,
    title: 'Kings of Israel and Judah and Their Legacies',
    pairs: [
      { id: 'ki1', left: 'Saul', right: 'First king who lost his kingdom through disobedience' },
      { id: 'ki2', left: 'David', right: 'Authored dozens of Psalms and defeated Philistines' },
      { id: 'ki3', left: 'Solomon', right: 'Erected the golden First Temple in Jerusalem' },
      { id: 'ki4', left: 'Josiah', right: 'Youngest reformer who rediscovered the lost Law' },
    ],
    reference: 'Books of Samuel, Kings, and Chronicles',
    explanation: 'Monarchs who shaped the worship, politics, and theological destiny of God’s covenant people.',
  },
  {
    levelGroup: 1,
    title: 'Notable Biblical Women and Their Courage',
    pairs: [
      { id: 'wo1', left: 'Esther', right: 'Risked her life before the king declaring "If I perish, I perish"' },
      { id: 'wo2', left: 'Deborah', right: 'Prophetess and judge who inspired victory at Mount Tabor' },
      { id: 'wo3', left: 'Hannah', right: 'Dedicated her promised son Samuel to the Tabernacle' },
      { id: 'wo4', left: 'Mary of Nazareth', right: 'Willingly yielded her life to bear the Son of God' },
    ],
    reference: 'Esther 4; Judges 4; 1 Samuel 1; Luke 1',
    explanation: 'Women of faith whose courage, prayers, and leadership altered the course of redemptive history.',
  },
  {
    levelGroup: 1,
    title: 'New Testament Figures and Their Defining Moments',
    pairs: [
      { id: 'nt1', left: 'Zacchaeus', right: 'Climbed a sycamore tree to see Jesus in Jericho' },
      { id: 'nt2', left: 'Nicodemus', right: 'Came to Jesus by night asking how to be born again' },
      { id: 'nt3', left: 'Lazarus', right: 'Called forth from the Bethany tomb after four days' },
      { id: 'nt4', left: 'Stephen', right: 'First Christian deacon stoned while forgiving enemies' },
    ],
    reference: 'Luke 19; John 3, 11; Acts 7',
    explanation: 'Memorable encounters with Jesus and the Holy Spirit illustrating transformation and witness.',
  },
  {
    levelGroup: 1,
    title: 'Brothers in the Old Testament',
    pairs: [
      { id: 'br1', left: 'Cain', right: 'Abel (First murder in human history)' },
      { id: 'br2', left: 'Jacob', right: 'Esau (Twin brothers of the red stew birthright)' },
      { id: 'br3', left: 'Moses', right: 'Aaron (Spokesman and first high priest)' },
      { id: 'br4', left: 'Joseph', right: 'Benjamin (Beloved youngest sons of Rachel)' },
    ],
    reference: 'Genesis 4, 25, 43; Exodus 4',
    explanation: 'Brothers whose rivalries, reconciliations, and alliances defined early biblical families.',
  },
  {
    levelGroup: 1,
    title: 'Biblical Figures and Their Occupations',
    pairs: [
      { id: 'oc1', left: 'Luke', right: 'The Beloved Physician who wrote Luke and Acts' },
      { id: 'oc2', left: 'Amos', right: 'Herdsman and tender of sycamore-fig trees' },
      { id: 'oc3', left: 'Nehemiah', right: 'Royal cupbearer to the Persian King Artaxerxes' },
      { id: 'oc4', left: 'Paul', right: 'Tentmaker in Corinth alongside Priscilla and Aquila' },
    ],
    reference: 'Colossians 4:14; Amos 7:14; Nehemiah 1:11; Acts 18:3',
    explanation: 'God called people from diverse trades and professions into prophetic and apostolic ministry.',
  },
  {
    levelGroup: 1,
    title: 'Biblical Figures and Their Enemies',
    pairs: [
      { id: 'en1', left: 'David', right: 'Goliath (Champion giant of Gath)' },
      { id: 'en2', left: 'Elijah', right: 'Jezebel (Phoenician queen who murdered prophets)' },
      { id: 'en3', left: 'Mordecai', right: 'Haman (Agagite enemy who erected the gallows)' },
      { id: 'en4', left: 'Samson', right: 'Delilah (Philistine woman who sheared his hair)' },
    ],
    reference: '1 Samuel 17; 1 Kings 19; Esther 3; Judges 16',
    explanation: 'Formidable adversaries through whom God tested His servants and manifested His glory.',
  },

  // --- STAGE 2: EASY (Levels 11–20) ---
  {
    levelGroup: 2,
    title: 'Alliances and Co-Workers in Acts',
    pairs: [
      { id: 'cw1', left: 'Paul', right: 'Silas (Sang praises together in the Philippian jail)' },
      { id: 'cw2', left: 'Barnabas', right: 'John Mark (Cousin who returned to ministry)' },
      { id: 'cw3', left: 'Aquila', right: 'Priscilla (Mentored eloquent orator Apollos in Ephesus)' },
      { id: 'cw4', left: 'Timothy', right: 'Eunice (Godly mother who taught him Scriptures)' },
    ],
    reference: 'Acts 16:25; 15:39; 18:26; 2 Timothy 1:5',
    explanation: 'The interpersonal network of mentors, co-laborers, and families that powered apostolic missions.',
  },
  {
    levelGroup: 2,
    title: 'Sons and Their Famous Fathers',
    pairs: [
      { id: 'fa1', left: 'Isaac', right: 'Abraham (Father of Faith)' },
      { id: 'fa2', left: 'David', right: 'Jesse of Bethlehem' },
      { id: 'fa3', left: 'Solomon', right: 'King David of Israel' },
      { id: 'fa4', left: 'John the Baptist', right: 'Zechariah the Priest' },
    ],
    reference: 'Genesis 21; 1 Samuel 16; 2 Samuel 12; Luke 1',
    explanation: 'Lineages through which covenant identity and priestly/royal callings passed.',
  },
  {
    levelGroup: 2,
    title: 'Biblical Animals and Their Defining Miracles',
    pairs: [
      { id: 'an1', left: 'Balaam’s Donkey', right: 'Spoke in human language to rebuke the blinded seer' },
      { id: 'an2', left: 'Elijah’s Ravens', right: 'Delivered bread and meat morning and evening at Cherith' },
      { id: 'an3', left: 'Jonah’s Great Fish', right: 'Swallowed the prophet and vomited him onto dry land' },
      { id: 'an4', left: 'Peter’s Rooster', right: 'Crowed twice as Peter denied his Lord three times' },
    ],
    reference: 'Numbers 22; 1 Kings 17; Jonah 2; Mark 14',
    explanation: 'Creatures sovereignly commanded by the Creator to fulfill prophetic warnings and provision.',
  },
  {
    levelGroup: 2,
    title: 'Mountains of Scripture and What Transpired There',
    pairs: [
      { id: 'mo1', left: 'Mount Sinai', right: 'Giving of the Ten Commandments in fire and cloud' },
      { id: 'mo2', left: 'Mount Carmel', right: 'Fire consumed Elijah’s sacrifice before Baal’s prophets' },
      { id: 'mo3', left: 'Mount Moriah', right: 'Abraham offered the ram; Solomon built the Temple' },
      { id: 'mo4', left: 'Mount Nebo', right: 'Moses viewed the Promised Land before his death' },
    ],
    reference: 'Exodus 19; 1 Kings 18; Genesis 22; Deuteronomy 34',
    explanation: 'Sacred topographical high places where covenants were ratified and the presence of God manifested.',
  },
  {
    levelGroup: 2,
    title: 'Bodies of Water and Their Miraculous Events',
    pairs: [
      { id: 'bw1', left: 'Red Sea', right: 'Parted overnight for Moses and Israel’s escape' },
      { id: 'bw2', left: 'Jordan River', right: 'Ceased flowing at flood stage for the Ark of God' },
      { id: 'bw3', left: 'Sea of Galilee', right: 'Jesus walked on its stormy waves during the fourth watch' },
      { id: 'bw4', left: 'Pool of Bethesda', right: 'Invalid of 38 years healed at the sheep gate pool' },
    ],
    reference: 'Exodus 14; Joshua 3; Matthew 14; John 5',
    explanation: 'Waters that witnessed divine dominion over nature in both covenants.',
  },
  {
    levelGroup: 2,
    title: 'Biblical Figures and Their Symbolic Numbers',
    pairs: [
      { id: 'nu1', left: 'Noah', right: '40 days and nights of torrential downpour' },
      { id: 'nu2', left: 'Gideon', right: '300 water-lapping warriors who defeated Midian' },
      { id: 'nu3', left: 'Jesus Christ', right: '40 days fasting in the Judean wilderness' },
      { id: 'nu4', left: 'Apostle Peter', right: '153 large fish caught in the miraculous unbroken net' },
    ],
    reference: 'Genesis 7; Judges 7; Matthew 4; John 21',
    explanation: 'Numeric milestones in Scripture signifying probation, victory, and fullness.',
  },
  {
    levelGroup: 2,
    title: 'Parables of Jesus and Their Core Symbols',
    pairs: [
      { id: 'pa1', left: 'The Sower', right: 'Four soils representing human heart responses' },
      { id: 'pa2', left: 'The Prodigal Son', right: 'Robbed son restored with robe, ring, and sandals' },
      { id: 'pa3', left: 'The Ten Virgins', right: 'Lamps and extra oil awaiting the midnight Bridegroom' },
      { id: 'pa4', left: 'The Talents', right: 'Coins entrusted to servants to invest for the Master' },
    ],
    reference: 'Matthew 13, 25; Luke 15',
    explanation: 'Metaphorical masterpieces illustrating the kingdom of God and eternal accountability.',
  },
  {
    levelGroup: 2,
    title: 'Old Testament Judges and Their Weapons',
    pairs: [
      { id: 'we1', left: 'Samson', right: 'Fresh jawbone of a donkey against 1,000 men' },
      { id: 'we2', left: 'Shamgar', right: 'Ox goad with which he struck down 600 Philistines' },
      { id: 'we3', left: 'Ehud', right: 'Double-edged cubit dagger hidden on his right thigh' },
      { id: 'we4', left: 'Gideon', right: 'Clay jars, burning torches, and blowing ram horns' },
    ],
    reference: 'Judges 3, 7, 15',
    explanation: 'Improbable, humble instruments utilized by God to confound the mighty.',
  },
  {
    levelGroup: 2,
    title: 'Gentile Converts in the New Testament',
    pairs: [
      { id: 'gc1', left: 'Cornelius', right: 'Roman centurion in Caesarea who received the Holy Spirit' },
      { id: 'gc2', left: 'Lydia', right: 'Seller of purple dye from Thyatira baptized in Philippi' },
      { id: 'gc3', left: 'The Philippian Jailer', right: 'Cried "What must I do to be saved?" after the earthquake' },
      { id: 'gc4', left: 'Sergius Paulus', right: 'Roman proconsul of Cyprus who believed Paul’s gospel' },
    ],
    reference: 'Acts 10, 13, 16',
    explanation: 'Early non-Jewish converts whose faith signaled the universal scope of redemption.',
  },
  {
    levelGroup: 2,
    title: 'Churches of Revelation and Their Praise or Rebuke',
    pairs: [
      { id: 're1', left: 'Ephesus', right: 'Rebuked for having left their first love' },
      { id: 're2', left: 'Smyrna', right: 'Praised for faithfulness under persecution and poverty' },
      { id: 're3', left: 'Philadelphia', right: 'Kept the word with little strength; set with an open door' },
      { id: 're4', left: 'Laodicea', right: 'Rebuked for being lukewarm, neither cold nor hot' },
    ],
    reference: 'Revelation 2-3',
    explanation: 'Seven historic churches in Asia Minor evaluated directly by the glorified Christ.',
  },
];
