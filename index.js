// размер карты
const width = 40
const height = 24

// создаём сетку, по умолчанию всё — стена (W)
let grid = Array.from({ length: height }, () => Array(width).fill('W'))

//  генерация комнат
function generateRooms() {
	// случайное количество комнат (5–10)
	const roomCount = Math.floor(Math.random() * 6) + 5
	for (let i = 0; i < roomCount; i++) {
		const rw = Math.floor(Math.random() * 6) + 3
		const rh = Math.floor(Math.random() * 6) + 3
		const rx = Math.floor(Math.random() * (width - rw - 1))
		const ry = Math.floor(Math.random() * (height - rh - 1))
		for (let y = ry; y < ry + rh; y++) {
			for (let x = rx; x < rx + rw; x++) {
				grid[y][x] = '.'
			}
		}
	}
}

// генерация проходов
function generateCorridors() {
	// случайное количество вертикальных и горизонтальных проходов (3–5)
	const vCount = Math.floor(Math.random() * 3) + 3
	const hCount = Math.floor(Math.random() * 3) + 3

	// вертикальные
	for (let i = 0; i < vCount; i++) {
		const cx = Math.floor(Math.random() * width)
		for (let y = 0; y < height; y++) {
			grid[y][cx] = '.'
		}
	}
	// горизонтальные
	for (let i = 0; i < hCount; i++) {
		const cy = Math.floor(Math.random() * height)
		for (let x = 0; x < width; x++) grid[cy][x] = '.'
	}
}

// размещение предметов и игрока
let player = { x: 0, y: 0, hp: 100, attack: 10 }
let enemies = []
let items = []

// вспомогательная функция: случайная пустая клетка
function getRandomEmptyCell() {
	let x, y
	do {
		x = Math.floor(Math.random() * width)
		y = Math.floor(Math.random() * height)
	} while (grid[y][x] !== '.')
	return [x, y]
}

function placeObjects() {
	// игрок
	;[player.x, player.y] = getRandomEmptyCell()
	grid[player.y][player.x] = 'P'

	// враги
	enemies = []
	for (let i = 0; i < 10; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'E'
		enemies.push({ x, y, hp: 50 })
	}

	// зелья
	for (let i = 0; i < 10; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'HP'
		items.push({ x, y, type: 'HP' })
	}

	// мечи
	for (let i = 0; i < 2; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'SW'
		items.push({ x, y, type: 'SW' })
	}
}

// отрисовка карты
const tileSize = 20
const field = document.querySelector('.field')

function render() {
	field.innerHTML = ''
	field.style.width = width * tileSize + 'px'
	field.style.height = height * tileSize + 'px'
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const tile = document.createElement('div')
			tile.classList.add('tile')
			const cell = grid[y][x]
			if (cell === 'W') tile.classList.add('tileW') // стена
			if (cell === 'P') tile.classList.add('tileP') // игрок
			if (cell === 'E') tile.classList.add('tileE') // враг
			if (cell === 'HP') tile.classList.add('tileHP') // зелье
			if (cell === 'SW') tile.classList.add('tileSW') // меч

			// полоска здоровья
			if (cell === 'P' || cell === 'E') {
				const hpBar = document.createElement('div')
				hpBar.classList.add('health')
				let hp =
					cell === 'P'
						? player.hp
						: enemies.find(e => e.x === x && e.y === y).hp
				hpBar.style.width = Math.max(0, hp) + '%'
				tile.appendChild(hpBar)
			}
			tile.style.position = 'absolute'
			tile.style.left = x * tileSize + 'px'
			tile.style.top = y * tileSize + 'px'
			tile.style.width = tileSize + 'px'
			tile.style.height = tileSize + 'px'
			field.appendChild(tile)
		}
	}
}

//  движение игрока
const keys = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] }
document.addEventListener('keydown', e => {
	if (keys[e.code]) {
		movePlayer(...keys[e.code])
		render()
	}
	if (e.code === 'Space') {
		playerAttack()
		render()
	}
})

function movePlayer(dx, dy) {
	const nx = player.x + dx
	const ny = player.y + dy
	if (nx < 0 || ny < 0 || nx >= width || ny >= height) return
	if (grid[ny][nx] === 'W') return

	const cell = grid[ny][nx]
	if (cell === 'HP') {
		player.hp = Math.min(100, player.hp + 30) // лечимся
	}
	if (cell === 'SW') {
		player.attack += 10 // усиливаем удар
	}

	grid[player.y][player.x] = '.'
	player.x = nx
	player.y = ny
	grid[ny][nx] = 'P'

	moveEnemies() // после хода игрока — ход врагов
}

//  атака игрока
function playerAttack() {
	const dirs = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]
	for (let [dx, dy] of dirs) {
		const nx = player.x + dx
		const ny = player.y + dy
		if (grid[ny] && grid[ny][nx] === 'E') {
			let enemy = enemies.find(e => e.x === nx && e.y === ny)
			enemy.hp -= player.attack
			if (enemy.hp <= 0) {
				grid[ny][nx] = '.'
				enemies = enemies.filter(e => e !== enemy)
			}
		}
	}
}

//  движение врагов
function moveEnemies() {
	const dirs = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]
	for (let enemy of enemies) {
		// если игрок рядом → атаковать
		if (Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y) === 1) {
			player.hp -= 10
			if (player.hp <= 0) alert('Вы погибли!')
			continue
		}
		// случайное движение
		const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)]
		const nx = enemy.x + dx
		const ny = enemy.y + dy
		if (grid[ny] && grid[ny][nx] === '.') {
			grid[enemy.y][enemy.x] = '.'
			enemy.x = nx
			enemy.y = ny
			grid[ny][nx] = 'E'
		}
	}
}

// запуск
generateRooms()
generateCorridors()
placeObjects()
render()
