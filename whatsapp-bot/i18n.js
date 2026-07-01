// Translations for the bot's own menu/prompt text. This does NOT translate
// user-submitted report content (locations, descriptions) — that stays in
// whatever language the person typed it in, since translating someone's
// fraud report risks distorting their meaning.
//
// IMPORTANT: Yoruba, Hausa, and Igbo translations here are a best effort,
// not reviewed by a native speaker. Given this bot handles legal/financial
// matters where a mistranslation could genuinely confuse someone or cause
// harm, get these reviewed by a fluent speaker before relying on them in
// production. Nigerian Pidgin is closer to English and lower-risk, but
// still worth a native-speaker pass before launch.

export const LANGUAGES = {
  '1': 'en',
  '2': 'pcm',
  '3': 'yo',
  '4': 'ha',
  '5': 'ig'
}

export const LANGUAGE_NAMES = {
  en: 'English',
  pcm: 'Pidgin',
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo'
}

const strings = {
  languagePrompt: {
    en: 'Welcome to KeyCheck. Choose your language:\n1. English\n2. Pidgin\n3. Yorùbá\n4. Hausa\n5. Igbo\n\nReply with a number.',
    pcm: 'Welcome to KeyCheck. Choose your language:\n1. English\n2. Pidgin\n3. Yorùbá\n4. Hausa\n5. Igbo\n\nReply with numba.',
    yo: 'Kaabo si KeyCheck. Yan ede rẹ:\n1. English\n2. Pidgin\n3. Yorùbá\n4. Hausa\n5. Igbo\n\nDahun pẹlu nọmba kan.',
    ha: 'Barka da zuwa KeyCheck. Zaɓi harshenka:\n1. English\n2. Pidgin\n3. Yorùbá\n4. Hausa\n5. Igbo\n\nAmsa da lamba.',
    ig: 'Nnọọ na KeyCheck. Họrọ asụsụ gị:\n1. English\n2. Pidgin\n3. Yorùbá\n4. Hausa\n5. Igbo\n\nZaghachi na nọmba.'
  },
  mainMenu: {
    en: 'KeyCheck — check before you buy, warn others after.\n\nWhat would you like to do?\n1. Report a land or agent problem\n2. Search a location or agent name\n3. How this works\n4. Reply to a report about me\n5. Change language\n\nReply with a number.',
    pcm: 'KeyCheck — check before you buy, warn oda pipo after.\n\nWetin you wan do?\n1. Report land or agent problem\n2. Search location or agent name\n3. How dis one dey work\n4. Reply to report wey dey mention me\n5. Change language\n\nReply with numba.',
    yo: 'KeyCheck — ṣayẹwo kí o tó ra, kí o kìlọ̀ fún àwọn míì lẹ́yìn náà.\n\nKí ni o fẹ́ ṣe?\n1. Jábọ̀ ìṣòro ilẹ̀ tàbí agbedemeji\n2. Wá ipò tàbí orúkọ agbedemeji\n3. Bí eyí ṣe ń ṣiṣẹ́\n4. Dáhùn ìjábọ̀ tí ó kàn mí\n5. Yí èdè padà\n\nDahun pẹlu nọmba kan.',
    ha: 'KeyCheck — duba kafin ka saya, ka gargaɗi wasu bayan haka.\n\nMe kake so ka yi?\n1. Kai rahoton matsalar ƙasa ko wakili\n2. Nemo wuri ko sunan wakili\n3. Yadda wannan yake aiki\n4. Ba da amsa kan rahoton da ya shafe ni\n5. Canza harshe\n\nAmsa da lamba.',
    ig: 'KeyCheck — lelee tupu ịzụta, dọọ ndị ọzọ aka ná ntị mgbe ahụ gasịrị.\n\nGịnị ka ị chọrọ ime?\n1. Kọọ maka nsogbu ala ma ọ bụ onye nnọchite\n2. Chọọ ebe ma ọ bụ aha onye nnọchite\n3. Etu nke a si arụ ọrụ\n4. Zaghachi akụkọ metụtara m\n5. Gbanwee asụsụ\n\nZaghachi na nọmba.'
  },
  reportTypeMenu: {
    en: 'What happened?\n1. Land sold to multiple people\n2. Fake or fraudulent land agent\n3. Fake Certificate of Occupancy\n4. Rental/letting agent fraud\n5. Landlord fraud\n6. Estate or developer fraud\n7. Other\n\nReply with a number.',
    pcm: 'Wetin happen?\n1. Dem sell land to plenty pipo\n2. Fake or fraudulent land agent\n3. Fake Certificate of Occupancy\n4. Rental/letting agent wey scam you\n5. Landlord wey scam you\n6. Estate or developer wey scam you\n7. Oda tin\n\nReply with numba.',
    yo: 'Kí ni ṣẹlẹ̀?\n1. A tà ilẹ̀ fún ènìyàn púpọ̀\n2. Agbedemeji ilẹ̀ èké\n3. Ìwé-ẹ̀rí Occupancy èké\n4. Agbedemeji ìyáwó ilé tí ó tan ọ jẹ\n5. Onílé tí ó tan ọ jẹ\n6. Estate tàbí olùdásílẹ̀ tí ó tan ọ jẹ\n7. Òmíràn\n\nDahun pẹlu nọmba kan.',
    ha: 'Me ya faru?\n1. An sayar da ƙasa ga mutane da yawa\n2. Wakilin ƙasa na ƙarya\n3. Takardar Zama (C of O) ta ƙarya\n4. Wakilin haya da ya yaudare ka\n5. Mai gida da ya yaudare ka\n6. Estate ko mai gina gidaje da ya yaudare ka\n7. Wani abu\n\nAmsa da lamba.',
    ig: 'Gịnị mere?\n1. E refere ala nye ọtụtụ mmadụ\n2. Onye nnọchite ala aghụghọ\n3. Asambodo Ọnọdụ (C of O) adịgboroja\n4. Onye nnọchite mgbazinye ụlọ ghọgburu gị\n5. Onye nwe ụlọ ghọgburu gị\n6. Estate ma ọ bụ onye na-ewu ụlọ ghọgburu gị\n7. Ihe ọzọ\n\nZaghachi na nọmba.'
  },
  askLocation: {
    en: 'Where is the land located? (Area, landmark, or address)',
    pcm: 'Where the land dey? (Area, landmark, or address)',
    yo: 'Níbo ni ilẹ̀ náà wà? (Àgbègbè, àmì-ìdámọ̀, tàbí àdírẹ́sì)',
    ha: 'Ina ƙasar take? (Yanki, alama, ko adireshi)',
    ig: 'Ebee ka ala ahụ dị? (Mpaghara, akara-njirimara, ma ọ bụ adreesị)'
  },
  askAgent: {
    en: "Do you know the agent's name or company? Reply with the name, or type \"skip\".",
    pcm: 'You know di agent name or company? Reply with di name, or type "skip".',
    yo: 'Ṣé o mọ orúkọ agbedemeji náà tàbí ilé-iṣẹ́? Dáhùn pẹlu orúkọ náà, tàbí kọ "skip".',
    ha: "Ka san sunan wakilin ko kamfani? Amsa da sunan, ko rubuta \"skip\".",
    ig: 'Ị maara aha onye nnọchite ma ọ bụ ụlọ ọrụ ya? Zaghachi aha ya, ma ọ bụ dee "skip".'
  },
  askDescription: {
    en: 'Briefly describe what happened (2-3 sentences is enough).',
    pcm: 'Explain small wetin happen (2-3 sentences fit do).',
    yo: 'Ṣàlàyé ní ṣókí ohun tí ó ṣẹlẹ̀ (gbolohun 2-3 tó).',
    ha: 'A taƙaice, bayyana abin da ya faru (jimla 2-3 sun isa).',
    ig: 'Kọwaa nkenke ihe merenụ (ahịrịokwu 2-3 zuru ezu).'
  },
  askEvidence: {
    en: 'Do you have any evidence — photos, documents, screenshots? Send them now, one at a time, or type "skip". Type "done" when finished.',
    pcm: 'You get evidence — photo, document, screenshot? Send dem now, one by one, or type "skip". Type "done" wen you finish.',
    yo: 'Ṣé o ní ẹ̀rí kankan — àwòrán, ìwé, screenshot? Fi wọ́n ránṣẹ́ báyìí, ọ̀kan lẹ́yìn òmíràn, tàbí kọ "skip". Kọ "done" nígbà tí o bá parí.',
    ha: 'Kana da wata shaida — hotuna, takardu, screenshot? Aika su yanzu, ɗaya bayan ɗaya, ko rubuta "skip". Rubuta "done" idan ka gama.',
    ig: 'Ị nwere ihe akaebe ọ bụla — foto, akwụkwọ, screenshot? Zipu ha ugbu a, otu n\'otu, ma ọ bụ dee "skip". Dee "done" mgbe ị mechara.'
  },
  evidenceReceived: {
    en: 'Got it. Send another, or type "done" to finish.',
    pcm: 'I don get am. Send anoda one, or type "done" to finish.',
    yo: 'Mo ti gbà á. Fi òmíràn ránṣẹ́, tàbí kọ "done" láti parí.',
    ha: 'Na karɓa. Aika wani, ko rubuta "done" don kammalawa.',
    ig: 'Anataala ya. Zipu ọzọ, ma ọ bụ dee "done" iji mechaa.'
  },
  reportSaved: {
    en: 'Thank you. Your report has been submitted for review (ref #{{id}}) and will appear on {{link}} once verified. Your identity stays anonymous unless you choose otherwise.\n\nReply "menu" to do something else, or "2" to search the database now.',
    pcm: 'Thank you. Your report don submit for review (ref #{{id}}) and e go show for {{link}} once dem verify am. Your identity go stay anonymous unless you choose otherwise.\n\nReply "menu" to do oda tin, or "2" to search di database now.',
    yo: 'A dúpẹ́. Ìjábọ̀ rẹ ti fi ránṣẹ́ fún àyẹ̀wò (ref #{{id}}) yóò sì farahàn lórí {{link}} ní kété tí wọ́n bá ti fi ìdí rẹ̀ múlẹ̀. Ìdánimọ̀ rẹ yóò dúró láìjẹ́ mí mọ̀ àyàfi tí o bá yàn bẹ́ẹ̀.\n\nDáhùn "menu" láti ṣe òmíràn, tàbí "2" láti wá inú ibi tí a ti pa data mọ́ báyìí.',
    ha: 'Na gode. An miƙa rahotonka don bita (ref #{{id}}) kuma zai bayyana a {{link}} da zarar an tabbatar da shi. Ainihinka zai kasance a ɓoye sai dai idan ka zaɓi akasin haka.\n\nAmsa "menu" don yin wani abu, ko "2" don nemo bayanan yanzu.',
    ig: 'Daalụ. Edetuola akụkọ gị maka nlebara anya (ref #{{id}}) ọ ga-apụtakwa na {{link}} ozugbo enyochachara ya. Njirimara gị ga-adịgide na nzuzo belụsọ ị họrọ ụzọ ọzọ.\n\nZaghachi "menu" iji mee ihe ọzọ, ma ọ bụ "2" iji chọọ ihe ndekọ ugbu a.'
  },
  searchPrompt: {
    en: 'Type the area, street, or agent name you want to check.',
    pcm: 'Type di area, street, or agent name wey you wan check.',
    yo: 'Kọ àgbègbè, òpópónà, tàbí orúkọ agbedemeji tí o fẹ́ ṣàyẹ̀wò.',
    ha: 'Rubuta yanki, titi, ko sunan wakilin da kake so ka duba.',
    ig: 'Dee mpaghara, okporo ámá, ma ọ bụ aha onye nnọchite ị chọrọ ilele.'
  },
  noResults: {
    en: 'No reports found for "{{query}}". That\'s a good sign, but it doesn\'t guarantee the land or agent is clean — only that nobody has reported a problem here yet.\n\nReply "menu" for more options.',
    pcm: 'No report dey for "{{query}}". Na good sign, but e no mean say di land or agent clean — na just say nobody don report problem here yet.\n\nReply "menu" for more options.',
    yo: 'Kò sí ìjábọ̀ tí a rí fún "{{query}}". Èyí jẹ́ àmì rere, ṣùgbọ́n kò dájú pé ilẹ̀ tàbí agbedemeji náà mọ́ — ó kàn túmọ̀ sí pé kò sí ẹnikẹ́ni tí ó ti jábọ̀ ìṣòro níbí síbẹ̀.\n\nDáhùn "menu" fún àṣàyàn síwájú sí i.',
    ha: 'Ba a sami rahoto ba don "{{query}}". Wannan alama ce mai kyau, amma ba tabbacin cewa ƙasar ko wakilin tsabtatacce ba ne — yana nufin babu wanda ya kai rahoton matsala a nan tukuna.\n\nAmsa "menu" don ƙarin zaɓuka.',
    ig: 'Ahụghị akụkọ ọ bụla maka "{{query}}". Nke a bụ ihe ịrịba ama ọma, mana ọ bụghị nkwenye na ala ma ọ bụ onye nnọchite ahụ dị ọcha — ọ pụtara naanị na ọ dịbeghị onye kọrọ nsogbu ebe a.\n\nZaghachi "menu" maka nhọrọ ndị ọzọ.'
  },
  replyReportIdPrompt: {
    en: "If a report names you and you'd like to respond, type the report reference number shown on the report page (e.g. 0001 or the ID from the link you were sent).",
    pcm: 'If report mention your name and you wan respond, type di report reference number wey dey show for di report page (like 0001 or di ID from di link wey dem send you).',
    yo: 'Tí ìjábọ̀ kan bá dárúkọ ọ tí o sì fẹ́ dáhùn, kọ nọ́mbà ìtọ́kasí ìjábọ̀ tí ó farahàn lórí ojú ìwé ìjábọ̀ náà (bí i 0001 tàbí ID láti inú ọ̀nà-ìjápọ̀ tí a fi ránṣẹ́ sí ọ).',
    ha: 'Idan rahoto ya ambaci sunanka kuma kana son ka amsa, rubuta lambar rahoton da take bayyana a shafin rahoton (misali 0001 ko ID daga hanyar da aka aiko maka).',
    ig: 'Ọ bụrụ na akụkọ akpọtụrụ aha gị ma ị chọrọ ịza, dee nọmba ntụaka akụkọ ahụ nke gosipụtara na peeji akụkọ ahụ (dịka 0001 ma ọ bụ ID sitere na njikọ ezigara gị).'
  },
  replyNotFound: {
    en: 'I couldn\'t find a report with reference "{{id}}". Double-check the number on the report page and try again, or reply "menu" to go back.',
    pcm: 'I no fit find report wey get reference "{{id}}". Check di numba for di report page again try again, or reply "menu" go back.',
    yo: 'N kò rí ìjábọ̀ kankan tí ó ní ìtọ́kasí "{{id}}". Ṣàyẹ̀wò nọ́mbà náà lórí ojú ìwé ìjábọ̀ padà kí o sì tún gbìyànjú, tàbí dáhùn "menu" láti padà.',
    ha: 'Ban sami rahoto mai lambar "{{id}}" ba. Duba lambar a shafin rahoton sannan ka sake gwadawa, ko ka amsa "menu" don komawa baya.',
    ig: 'Achọtaghị m akụkọ nwere ntụaka "{{id}}". Lelee nọmba ahụ na peeji akụkọ ahụ ọzọ nwaa ọzọ, ma ọ bụ zaghachi "menu" ka ị laghachi azụ.'
  },
  replyFound: {
    en: 'Found it: "{{label}}". What\'s your relationship to this report?\n\n1. I am the named agent or company\n2. I am the named landowner\n\nReply with a number.',
    pcm: 'I don see am: "{{label}}". Wetin be your relationship to dis report?\n\n1. I be di agent or company wey dem mention\n2. I be di landowner wey dem mention\n\nReply with numba.',
    yo: 'Mo ti rí i: "{{label}}". Kí ni ìbáṣepọ̀ rẹ pẹ̀lú ìjábọ̀ yìí?\n\n1. Èmi ni agbedemeji tàbí ilé-iṣẹ́ tí a dárúkọ\n2. Èmi ni onílẹ̀ tí a dárúkọ\n\nDahun pẹlu nọmba kan.',
    ha: 'An samu: "{{label}}". Menene alaƙarka da wannan rahoton?\n\n1. Ni ne wakilin ko kamfanin da aka ambata\n2. Ni ne mai gonar da aka ambata\n\nAmsa da lamba.',
    ig: 'Achọtala ya: "{{label}}". Gịnị bụ mmekọrịta gị na akụkọ a?\n\n1. Abụ m onye nnọchite ma ọ bụ ụlọ ọrụ a kpọtụrụ aha\n2. Abụ m onye nwe ala a kpọtụrụ aha\n\nZaghachi na nọmba.'
  },
  askReplyText: {
    en: 'Go ahead and write your response. This will appear publicly alongside the report.',
    pcm: 'Go ahead write your response. E go show public alongside di report.',
    yo: 'Kọ ìdáhùn rẹ. Yóò farahàn ní gbangba lẹ́gbẹ̀ẹ́ ìjábọ̀ náà.',
    ha: 'Ci gaba ka rubuta amsarka. Zai bayyana a fili tare da rahoton.',
    ig: 'Gaa n\'ihu dee azịza gị. Ọ ga-apụta n\'ihu ọha na akụkọ ahụ.'
  },
  replySaved: {
    en: 'Thank you. Your reply has been added to "{{label}}" and is now visible publicly, marked unverified until reviewed.\n\nView it: {{link}}\n\nReply "menu" for more options.',
    pcm: 'Thank you. Your reply don add to "{{label}}" and e dey visible now, marked unverified until dem review am.\n\nView am: {{link}}\n\nReply "menu" for more options.',
    yo: 'A dúpẹ́. A ti fi ìdáhùn rẹ kún "{{label}}" ó sì ti farahàn ní gbangba báyìí, tí a sàmì sí gẹ́gẹ́ bí aídánilójú títí a ó fi ṣàyẹ̀wò rẹ̀.\n\nWo ó: {{link}}\n\nDáhùn "menu" fún àṣàyàn síwájú sí i.',
    ha: 'Na gode. An ƙara amsarka zuwa "{{label}}" kuma yanzu ana iya ganin ta a fili, an yi mata alama a matsayin ba a tabbatar ba sai an bita.\n\nDuba ta: {{link}}\n\nAmsa "menu" don ƙarin zaɓuka.',
    ig: 'Daalụ. Agbakwunyela azịza gị na "{{label}}" ọ na-apụtakwa n\'ihu ọha ugbu a, akara ya dịka a na-akwadobeghị ya ruo mgbe elelere ya.\n\nLee ya: {{link}}\n\nZaghachi "menu" maka nhọrọ ndị ọzọ.'
  },
  howItWorks: {
    en: 'KeyCheck is a free, community-run registry. People report land and agent problems they\'ve experienced. Anyone can search before buying land or hiring an agent. Reports are marked unverified until reviewed, and you can stay anonymous when reporting.\n\nReply "menu" to go back.',
    pcm: 'KeyCheck na free registry wey community dey run. Pipo dey report land and agent problems wey dem don experience. Anybody fit search before dem buy land or hire agent. Reports dey marked unverified until dem review am, and you fit stay anonymous wen you dey report.\n\nReply "menu" to go back.',
    yo: 'KeyCheck jẹ́ ibi ìforúkọsílẹ̀ ọ̀fẹ́ tí àwùjọ ń ṣàkóso. Àwọn ènìyàn ń jábọ̀ ìṣòro ilẹ̀ àti agbedemeji tí wọ́n ti ní ìrírí rẹ̀. Ẹnikẹ́ni lè wá kí wọ́n tó ra ilẹ̀ tàbí gba agbedemeji ṣiṣẹ́. A máa ń sàmì sí àwọn ìjábọ̀ gẹ́gẹ́ bí aídánilójú títí a ó fi ṣàyẹ̀wò wọn, o sì lè dúró láìjẹ́ mí mọ̀ nígbà tí o bá ń jábọ̀.\n\nDáhùn "menu" láti padà.',
    ha: 'KeyCheck babban rijista ce ta kyauta wanda al\'umma ke gudanarwa. Mutane suna kai rahoton matsalolin ƙasa da wakilai da suka fuskanta. Kowa zai iya nema kafin ya sayi ƙasa ko ya ɗauki wakili. Ana yi wa rahotanni alama a matsayin ba a tabbatar ba sai an bita, kuma za ka iya kasancewa a ɓoye lokacin da kake kai rahoto.\n\nAmsa "menu" don komawa baya.',
    ig: 'KeyCheck bụ ndekọ efu nke obodo na-elekọta. Ndị mmadụ na-akọ nsogbu ala na ndị nnọchite ha nwetara. Onye ọ bụla nwere ike ịchọ ihe tupu ọ zụta ala ma ọ bụ gbaa onye nnọchite ọrụ. A na-akara akụkọ dịka a na-akwadobeghị ya ruo mgbe elelere ya, ị nwekwara ike ịnọgide na nzuzo mgbe ị na-akọ akụkọ.\n\nZaghachi "menu" ka ị laghachi azụ.'
  },
  invalidChoice: {
    en: "Sorry, I didn't get that.",
    pcm: 'Sorry, I no understand dat one.',
    yo: 'Má bínú, mi ò gbọ́ àwòrán yẹn dáadáa.',
    ha: 'Yi haƙuri, ban gane ba.',
    ig: 'Ndo, aghọtaghị m nke ahụ.'
  }
}

export function t(lang, key, params = {}) {
  const langStrings = strings[key] || {}
  let text = langStrings[lang] || langStrings.en || key
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{{${k}}}`, v)
  }
  return text
}
