//  настройки карты
const width = 40
const height = 24
let grid = Array.from({ length: height }, () => Array(width).fill('W'))

//  генерация комнат
function generateRooms() {
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

//  генерация проходов
function generateCorridors() {
	const vCount = Math.floor(Math.random() * 3) + 3
	const hCount = Math.floor(Math.random() * 3) + 3
	for (let i = 0; i < vCount; i++) {
		const cx = Math.floor(Math.random() * width)
		for (let y = 0; y < height; y++) grid[y][cx] = '.'
	}
	for (let i = 0; i < hCount; i++) {
		const cy = Math.floor(Math.random() * height)
		for (let x = 0; x < width; x++) grid[cy][x] = '.'
	}
}

//  связность карты
function ensureConnectivity() {
	let start = null
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (grid[y][x] === '.') {
				start = [x, y]
				break
			}
		}
		if (start) break
	}
	if (!start) return

	let visited = Array.from({ length: height }, () => Array(width).fill(false))
	let queue = [start]
	visited[start[1]][start[0]] = true

	while (queue.length > 0) {
		const [cx, cy] = queue.shift()
		for (let [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const nx = cx + dx,
				ny = cy + dy
			if (
				nx >= 0 &&
				ny >= 0 &&
				nx < width &&
				ny < height &&
				!visited[ny][nx] &&
				grid[ny][nx] === '.'
			) {
				visited[ny][nx] = true
				queue.push([nx, ny])
			}
		}
	}
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (grid[y][x] === '.' && !visited[y][x]) grid[y][x] = 'W'
		}
	}
}

//  игрок, враги, предметы
let player = { x: 0, y: 0, hp: 100, attack: 10 }
let enemies = []
let items = []

function getRandomEmptyCell() {
	let x, y
	do {
		x = Math.floor(Math.random() * width)
		y = Math.floor(Math.random() * height)
	} while (grid[y][x] !== '.')
	return [x, y]
}

function placeObjects() {
	;[player.x, player.y] = getRandomEmptyCell()
	grid[player.y][player.x] = 'P'

	enemies = []
	for (let i = 0; i < 10; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'E'
		enemies.push({ x, y, hp: 50 })
	}
	for (let i = 0; i < 10; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'HP'
		items.push({ x, y, type: 'HP' })
	}
	for (let i = 0; i < 2; i++) {
		let [x, y] = getRandomEmptyCell()
		grid[y][x] = 'SW'
		items.push({ x, y, type: 'SW' })
	}
}

// отрисовка
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
			if (cell === 'W') tile.classList.add('tileW')
			if (cell === 'P') tile.classList.add('tileP')
			if (cell === 'E') tile.classList.add('tileE')
			if (cell === 'HP') tile.classList.add('tileHP')
			if (cell === 'SW') tile.classList.add('tileSW')

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

//  управление
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
	const nx = player.x + dx,
		ny = player.y + dy
	if (nx < 0 || ny < 0 || nx >= width || ny >= height) return
	if (grid[ny][nx] === 'W' || grid[ny][nx] === 'E') return

	const cell = grid[ny][nx]
	if (cell === 'HP') player.hp = Math.min(100, player.hp + 30)
	if (cell === 'SW') player.attack += 10

	grid[player.y][player.x] = '.'
	player.x = nx
	player.y = ny
	grid[ny][nx] = 'P'
	moveEnemies()
}

//  атака игрока
function playerAttack() {
	for (let [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		const nx = player.x + dx,
			ny = player.y + dy
		if (grid[ny] && grid[ny][nx] === 'E') {
			let enemy = enemies.find(e => e.x === nx && e.y === ny)
			enemy.hp -= player.attack
			if (enemy.hp <= 0) {
				grid[ny][nx] = '.'
				enemies = enemies.filter(e => e !== enemy)
			} else {
				player.hp -= 10
				if (player.hp <= 0) alert('Вы погибли!')
			}
		}
	}
}

// движение врагов
function moveEnemies() {
	const dirs = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]
	for (let enemy of enemies) {
		if (Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y) === 1) {
			player.hp -= 10
			if (player.hp <= 0) alert('Вы погибли!')
			continue
		}
		const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)]
		const nx = enemy.x + dx,
			ny = enemy.y + dy
		if (grid[ny] && grid[ny][nx] === '.') {
			grid[enemy.y][enemy.x] = '.'
			enemy.x = nx
			enemy.y = ny
			if (!(enemy.x === player.x && enemy.y === player.y)) grid[ny][nx] = 'E'
		}
	}
}

//запуск
generateRooms()
generateCorridors()
ensureConnectivity()
placeObjects()
render()
