'use script'

var BOMB = '💣';
var FLAG = '🚩';
var BLOCK = '';

//state of cell
var gCell = {
    minesAroundCount: 0,
    isShown: false,
    isMine: false,
    isMarked: false,
};
//state board game level
var gLevel = {
    1: {
        SIZE: 4,
        MINES: 2,
    },
    2: {
        SIZE: 8,
        MINES: 12,
    },
    3: {
        SIZE: 12,
        MINES: 30,
    },
};

var gSelectedLevel = 1;//?

//state of game
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
};

var gBoard;
var gMines;
var gFirstClicked = true;
var gCountFlag = 0;
var gScore;
var gBestScore = 0;
var gResult = '';//maybe don't need

var ElScore = null;
var ElBestScore = null;

var ElTimer = null;
var timerId = null;
var timerCount = 0;
var gArrHistory = [];//? undo
var gLives;
var gHints;
var gIsHint;

function init() {
    gBoard = buildBoard();
    renderBoard();
    ElScore = document.querySelector('h2 span');
    ElBestScore = document.querySelector('h3 span');
    //ElTimer = document.getElementById('timer');
    gBestScore = gScore > gBestScore ? gScore : gBestScore;
    ElBestScore.innerHTML = ` ${gBestScore}`;
    gMines = [];
    gScore = 0;
    ElScore.innerHTML = gScore;
    gFirstClicked = true;//?
    //clearInterval(timerId);
    //timerCount = 0;
    gLives = 3;
    gHints = 3;
    gIsHint = false;
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel[gSelectedLevel].SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel[gSelectedLevel].SIZE; j++) {
            board[i][j] = { ...gCell }; // copy object to new object
        }
    }
    console.log(board)
    return board;
}

function renderBoard() {
    console.log(gBoard);
    gArrHistory.push(gBoard);
    var strHtml = '';
    for (var i = 0; i < gBoard.length; i++) {
        strHtml += '<tr>';
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            var icon = '';

            var className = !cell.isMine && cell.isShown && !cell.minesAroundCount ? 'shown' : '';
            //console.log(cell);
            if (cell.isShown) {
                if (cell.minesAroundCount > 0) {
                    icon = cell.minesAroundCount;
                }
            }
            if (cell.isMarked) {
                icon = FLAG;
            }
            if (cell.isShown && cell.isMine) {
                icon = BOMB;
            }

            //console.log('cell', cell.isMine, icon);
            strHtml += `<td class="cell ${className}" data-i="${i}" data-j="${j}"
             onclick="cellClicked( this,${i},${j})" oncontextmenu="onRightClick(event, ${i},${j})"> ${icon} </td>`;
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHtml;

}

function cellClicked(elCell, i, j) {
    var clickedCelll = gBoard[i][j];
    console.log(clickedCelll)
    //if (gIsHint) {
    //    shownNeg(elCell, i, j);
    //}
    if (gFirstClicked) {
        //gArrHistory[0] = { i, j };
        //only in first click
        setMines(i, j);
        setMinesNegCount();
        gFirstClicked = false;
        gScore += 1;
    } else if (!clickedCelll.minesAroundCount && !clickedCelll.isMine) {
        expandShown(i, j);//?
        gScore += 1;
        checkGameOver();
    } else if (clickedCelll.isMine) {
        if (gLives > 0) {
            gLives--;
            //var elBaloon = document.querySelector('.baloon');//?
            //.innerText = '';
            clickedCelll.isMarked = true;
            console.log('live:', gLives);
        } else {
            var elSmiley = document.querySelector('.smiley');
            elSmiley.innerHTML = '🤯'
            shownMines();

        }
    } else {
        gScore += 1;
        checkGameOver();
    }
    clickedCelll.isShown = true;
    checkGameOver();
    updateScore();
    var newbBoard =gBoard;
    gArrHistory.push(newbBoard);
    renderBoard();
}

function onRightClick(event, i, j) {
    event.preventDefault();
    console.log('onRightClick', i, j);
    var clickedCelll = gBoard[i][j];
    clickedCelll.isMarked = !clickedCelll.isMarked;
    renderBoard();
}

function updateScore() {
    ElScore.innerHTML = ` ${gScore}`;
}

function setMines(i, j) {
    //check
    // console.log(gBoard);
    //console.log('set mines', i, j);
    for (var idx = 0; idx < gLevel[gSelectedLevel].MINES; idx++) {
        var intI = getRandomInt(0, gLevel[gSelectedLevel].SIZE - 1); //getRandomInt
        var intJ = getRandomInt(0, gLevel[gSelectedLevel].SIZE - 1);
        console.log(intI, intJ);
        if (intI === i && intJ === j) {
            i--;
            continue;
        }
        gBoard[intI][intJ].isMine = true;
        gMines.push(gBoard[intI][intJ]);
        // console.log(gMines)
    }
}

function setMinesNegCount() {//maybe search only the mines ?
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                for (var idx = i - 1; idx <= i + 1; idx++) {
                    for (var jIdx = j - 1; jIdx <= j + 1; jIdx++) {
                        if ((idx < 0) || (idx > gLevel[gSelectedLevel].SIZE) ||
                            (jIdx < 0) || (jIdx > gLevel[gSelectedLevel].SIZE)) continue; {
                            if (!gBoard[idx][jIdx].isMine) {
                                gBoard[idx][jIdx].minesAroundCount++;
                            }
                        }
                    }

                }
            }
        }
    }
}

function checkGameOver() {
    var isMinesMarked = true;
    var isCellsShown = true;
    console.log('gMines', gMines);

    for (var idx = 0; idx < gMines.length; idx++) {
        var mine = gMines[idx];
        //console.log(mine);
        if (!mine.isMarked) {
            isMinesMarked = false;
            break;
        }
    }

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isMine && !cell.isShown) {
                isCellsShown = false;
            }
        }
    }
    console.log(isCellsShown)
    console.log(isMinesMarked)

    if (isMinesMarked && isCellsShown) {
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerHTML = '😎';
        console.log('YOU WIN')

    }
}

function expandShown(i, j) {
    for (var idx = i - 1; idx <= i + 1; idx++) {
        for (var jIdx = j - 1; jIdx <= j + 1; jIdx++) {
            if ((idx < 0) || (idx >= gLevel[gSelectedLevel].SIZE) ||
                (jIdx < 0) || (jIdx >= gLevel[gSelectedLevel].SIZE)) continue; {
                var cell = gBoard[idx][jIdx];
                if (!cell.isShown && !cell.isMine) {
                    if (!cell.minesAroundCount) {
                        cell.isShown = true;
                        expandShown(idx, jIdx);
                    } else {
                        cell.isShown = true;
                    }
                }
            }
        }
    }
}

function shownMines() {//gMines!
    for (var i = 0; i < gLevel[gSelectedLevel].SIZE; i++) {
        for (var j = 0; j < gLevel[gSelectedLevel].SIZE; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) cell.isShown = true;
        }
    }
    renderBoard();
}

function playAgain() {
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerHTML = '😀'
    init();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function undo() {
    console.log('undo')
    if (gArrHistory.length === 0) return
    else {
        var undoArr = gArrHistory.pop()
        gBoard = undoArr;
        console.log(gBoard);
        renderBoard();
    }
}




