function generateCallsigns() {
    const prefixes = [
        'EA', 'DL', 'JA', 'VK', 'VE', 'G', 'F', 'I', 'PY', 'OH', 'ZS', 'VU', 'SP', 'CT', 'HB',
        'LU', '9A', 'OE', 'SV', 'CX', 'YV', 'ZL', 'CO', 'W', 'K', 'ON', 'PA', 'SM', 'LA', 'EI'
    ];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const callsigns = new Set();
    while (callsigns.size < 50) {
        let prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        let digit = digits[Math.floor(Math.random() * digits.length)];
        let suffix = '';
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            suffix += letters[Math.floor(Math.random() * letters.length)];
        }
        let callsign = prefix + digit + suffix;
        if (callsign.length <= 6) callsigns.add(callsign);
    }
    return Array.from(callsigns);
}

const words = [
    'add', 'box', 'cat', 'dog', 'elf', 'fix', 'gap', 'hit', 'ice', 'joy',
    'key', 'lip', 'man', 'net', 'oak', 'pen', 'quiz', 'run', 'sky', 'top',
    'use', 'van', 'win', 'xray', 'yes', 'zip', 'act1', 'big', 'cry', 'dig2',
    'eat', 'fun', 'get', 'hat3', 'ink', 'job', 'kid4', 'log', 'mix', 'now5',
    'odd', 'pet', 'red', 'sun6', 'tip', 'up7', 'vet', 'web8', 'yak', 'zen9'
];

// Shuffle array utility
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateQSO(userCallsign) {
    const names = ['STEVE', 'ROY', 'JANE', 'MIKE', 'LISA', 'TOM', 'ANNA', 'BOB'];
    const qths = ['LAX', 'NYC', 'CHI', 'DEN', 'SFO', 'MIA', 'SEA', 'HOU'];
    const rigs = ['KX3', 'K3S', 'IC7300', 'FTDX10', 'TS590', 'FLEX6400'];
    const antennas = ['YAGI', 'LOOP', 'DIPOLE', 'VERTICAL'];
    const wxConditions = ['SUNNY', 'RAIN', 'CLOUDY', 'WINDY'];
    const rstReports = ['599', '579', '559', '469'];
    const otherCallsign = generateCallsigns()[Math.floor(Math.random() * 50)];
    const name = names[Math.floor(Math.random() * names.length)];
    const qth = qths[Math.floor(Math.random() * qths.length)];
    const rig = rigs[Math.floor(Math.random() * rigs.length)];
    const antenna = antennas[Math.floor(Math.random() * antennas.length)];
    const wx = wxConditions[Math.floor(Math.random() * wxConditions.length)];
    const rst = rstReports[Math.floor(Math.random() * rstReports.length)];
    return [
        `CQ CQ DE ${otherCallsign} ${otherCallsign} K`,
        `${otherCallsign} DE ${userCallsign} K`,
        `${userCallsign} DE ${otherCallsign} = GA ES TNX FER CALL = UR RST IS ${rst} ${rst} = NAME HR ${name} ${name} QTH ${qth} ${qth} = HW CPY? ${userCallsign} DE ${otherCallsign} KN`,
        `${otherCallsign} DE ${userCallsign} R GA ${name} TNX RPT = RST 579 579 = OP HR ${userCallsign.split(' ')[0]} ${userCallsign.split(' ')[0]} QTH MY QTH = HW? ${otherCallsign} DE ${userCallsign} KN`,
        `${userCallsign} DE ${otherCallsign} = R TNX RPT = RIG HR ${rig} ANT ${antenna} = WX ${wx} = HW? ${userCallsign} DE ${otherCallsign} K`,
        `${otherCallsign} DE ${userCallsign} = FB ${name} = RIG MY RIG ANT MY ANT = WX MY WX = 73 SK ${otherCallsign} DE ${userCallsign} K`,
        `${userCallsign} DE ${otherCallsign} = TNX QSO 73 AR SK ${userCallsign} DE ${otherCallsign} E E`,
        `${otherCallsign} DE ${userCallsign} E E`
    ];
}