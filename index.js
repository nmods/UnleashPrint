const DEFAULT_HOOK_SETTINGS = { order: -1001, filter: { fake: false } };

module.exports = function UnleashPrint(mod) {
	const command = mod.command || mod.require.command;

	let enabled = false,
		unleashes = [],
		inUnleash = false,
		currentUnleash = 0,
		mode = 'damage'

	mod.game.on('enter_game', init);

	function init() {
		enabled = mod.game.me.class === 'berserker'
		if (enabled) {
			currentUnleash = 0
			unleashes = []
			inUnleash = false
		}
	}

	command.add('unleashprint', (arg1, arg2) => {
		switch (arg1) {
			case 'last':
				if (!arg2) arg2 = 1
				if (unleashes.length == 0) {
					command.message('No unleashes used yet.')
					return
				}

				for (let i = unleashes.length - Number(arg2); i < unleashes.length; i++) {
					reportUnleash(i);
				}
				break
			case 'toggle':
			case 'mode':
				if (['both', 'skill', 'damage'].includes(arg2)) {
					mode = arg2
					command.message('Print mode switched to ' + mode)
				} else if (arg2 == undefined) {
					command.message('Current mode is ' + mode)
				} else {
					command.message('Valid arguments for unleashprint mode: both, skill, damage')
				}
				break
			case 'raw':
				if (arg2 == 'raw') {
					console.log(JSON.stringify(unleashes, null, 4))
				} else {
					for (let unleash of unleashes) {
						console.log('Unleash at: ' + getTime(unleash.time))
						//console.log(JSON.stringify(unleash, null, 4))
						let d = true
						for (let array of [unleash.damages, unleash.skills]) {
							console.log("\n" + d ? 'DAMAGES' : 'SKILLS')
							d = !d
							for (let skill of array) {
								let skillname = ''
								switch (skill.group) {
									case 34:
										skillname = 'DEXTER'
										break
									case 35:
										skillname = 'SINISTR'
										break
									case 36:
										skillname = 'RAMPAGE'
										break
									case 37:
										skillname = 'BEAST'
										break
									default:
										skillname = 'OTHER'
										break
								}
								console.log(skill.time + '\t' + skillname + '\t' + skill.group + '-' + skill.sub)
							}
						}
					}
				}
				break
			default:
				command.exec('unleashprint last')
				return
		}
	});

	mod.hook('C_START_SKILL', 7, DEFAULT_HOOK_SETTINGS, (event) => {
		if (!enabled || !inUnleash) return
		let data = skillInfo(event.skill.id)
		if ([34, 35, 36, 37].includes(data.group)) {
			data.time = Date.now() - unleashes[currentUnleash].time
			unleashes[currentUnleash].skills.push(data)
		}

	});
	mod.hook('S_EACH_SKILL_RESULT', 14, DEFAULT_HOOK_SETTINGS, (event) => {
		if (!enabled || !inUnleash || !mod.game.me.is(event.source) || event.value == 0) return
		let data = skillInfo(event.skill.id)
		if ([34, 35, 36, 37].includes(data.group)) {
			data.time = Date.now() - unleashes[currentUnleash].time
			unleashes[currentUnleash].damages.push(data)
			unleashes[currentUnleash].totalDamage += Number(event.value)
		}
	});

	mod.hook('S_ABNORMALITY_BEGIN', 3, DEFAULT_HOOK_SETTINGS, (event) => {
		if (!enabled || !mod.game.me.is(event.target) || inUnleash || event.id != 401712) return
		//console.log('BEGIN' + getTime(Date.now()));console.log(event);
		inUnleash = true;
		unleashes[currentUnleash] = {
			time: Date.now(),
			damages: [],
			skills: [],
			finished: false,
			incomplete: true,
			totalDamage: 0
		}
	});
	mod.hook('S_ABNORMALITY_END', 1, DEFAULT_HOOK_SETTINGS, (event) => {
		if (!enabled || !mod.game.me.is(event.target) || !inUnleash || event.id != 401712) return
		//console.log('END' + getTime(Date.now()));console.log(event);
		unleashes[currentUnleash].finished = true;
		if (Date.now() > unleashes[currentUnleash].time + 15000) unleashes[currentUnleash].incomplete = false
		setTimeout(function () {
			inUnleash = false;
			reportUnleash(currentUnleash)
			currentUnleash++
		}, 5000)
	});


	function reportUnleash(id) {
		if (!unleashes[id]) {
			console.log('error wrong id: ' + id)
			return
		}
		switch (mode) {
			case 'both':
				printUnleash(unleashes[id], false)
				printUnleash(unleashes[id], true)
				break
			case 'skill':
				printUnleash(unleashes[id], false)
				break
			case 'damage':
				printUnleash(unleashes[id], true)
				break
		}
	}

	function printUnleash(unleash, fromDamages = false) {
		let s = '' + getTime(unleash.time)
		s += fromDamages ? ' D: ' : ' S: '
		s += 'TOTAL: ' + formatNumber(unleash.totalDamage)

		let rampages = 0
		for (let skill of unleash.damages) { if (skill.group == 36) rampages++ }

		s += ', ' + rampages + 'R'
		s += unleash.incomplete ? ' - INCOMPLETE' : ''
		command.message(s)
		command.message(skillArrayToString(fromDamages ? unleash.damages : unleash.skills))
	}

	function skillArrayToString(array) {
		let s = ''
		let dexter = 0, sinister = 0, rampage = 0, beast = 0, dexterFirst = false
		for (let skill of array) {
			switch (skill.group) {
				case 34:
					s += stringBeast(beast)
					beast = 0
					s += stringRampage(rampage)
					rampage = 0
					dexter++
					dexterFirst = true
					break
				case 35:
					s += stringBeast(beast)
					beast = 0
					s += stringRampage(rampage)
					rampage = 0
					sinister++
					if (dexter == 0) dexterFirst = false
					break
				case 36:
					s += stringBeast(beast)
					beast = 0
					s += stringDexterSinister(dexter, sinister, dexterFirst)
					dexter = sinister = 0
					rampage++
					break
				case 37:
					s += stringRampage(rampage)
					rampage = 0
					s += stringDexterSinister(dexter, sinister, dexterFirst)
					dexter = sinister = 0
					beast++
					break
				default:
					break
			}
		}
		s += stringBeast(beast)
		s += stringRampage(rampage)
		s += stringDexterSinister(dexter, sinister, dexterFirst)
		if (s[s.length - 1] == '-') s = s.slice(0, -1)

		return s
	}

	function stringDexterSinister(dexter, sinister, dexterFirst) {
		if (dexter > 0 && sinister > 0) {
			if (dexterFirst) {
				return dexter + 'D-' + sinister + 'S-'
			} else {
				return sinister + 'S-' + dexter + 'D-'
			}
		} else if (dexter > 0 && sinister == 0) {
			return dexter + 'D-'
		} else if (sinister > 0 && dexter == 0) {
			return sinister + 'S-'
		} else return ''
	}
	function stringRampage(rampage) {
		if (rampage > 0) return rampage + 'R-'
		else return ''
	}
	function stringBeast(beast) {
		if (beast > 0) return beast + 'BF-'
		else return ''
	}

	function formatNumber(number) {
		number = Number(number)
		if (number / 1000000 > 1) {
			return Math.round(number / 1000000) + 'M'
		} else {
			return '' + number
		}
	}

	function skillInfo(id) {
		let data = {
			group: Math.floor(id / 10000),
			sub: id % 100
		}
		return data
	}

	function getTime(date) {
		let now = date ? new Date(date) : new Date;
		let hours = now.getHours().toString().padStart(2, '0');
		let minutes = now.getMinutes().toString().padStart(2, '0');
		let seconds = now.getSeconds().toString().padStart(2, '0');
		return '[' + hours + ':' + minutes + ':' + seconds + ']'
	}

	this.destructor = () => { //for reloading purposes
		command.remove('unleashprint');
	};
};