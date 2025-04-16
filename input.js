class SimEl
{
  constructor(_title, _id)
  {
    var c = document.getElementById('simulations');
    var div = document.createElement('div');
    div.class = "simulation";
    div.innerHTML = 
        '<h2>'+_title+'</h2>\
        <canvas id="canvas'+_id+'" width="500" height="400"></canvas>\
        <div>Status: <span id="status'+_id+'">Ready</span></div>\
        <div>Iterations: <span id="iterations'+_id+'">0</span></div>\
        <div>Time: <span id="time'+_id+'">0</span> ms</div>';
    c.appendChild(div);
    this.title = _title;
    this.id = _id;
    this.canvas = document.getElementById('canvas'+_id);
    this.ctx = this.canvas.getContext('2d');
    this.status = document.getElementById('status'+_id);
    this.iterations = document.getElementById('iterations'+_id);
    this.time = document.getElementById('time'+_id);
  }
}

class DOM
{
  init = function()
  {
    this.startBtn = document.getElementById('startBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.speedInput = document.getElementById('speed');
    this.speedValue = document.getElementById('speedValue');
    this.rowsInput = document.getElementById('rows');
    this.rowsValue = document.getElementById('rowsValue');
    this.colsInput = document.getElementById('cols');
    this.colsValue = document.getElementById('colsValue');
    this.bagInput = document.getElementById('bag');
    this.bagValue = document.getElementById('bagValue');
    this.results = document.getElementById('results');

    this.speedInput.addEventListener('input', () => { this.speedValue.textContent = speedInput.value; });
    this.rowsInput.addEventListener('input', () => { this.rowsValue.textContent = rowsInput.value; });
    this.colsInput.addEventListener('input', () => { this.colsValue.textContent = colsInput.value; });
    this.bagInput.addEventListener('input', () => { this.bagValue.textContent = bagInput.value; });
    this.resetBtn.addEventListener('click', resetSimulations);
    this.startBtn.addEventListener('click', startSimulations);
    
    this.speedValue.textContent = this.speedInput.value;
    this.rowsValue.textContent = this.rowsInput.value;
    this.colsValue.textContent = this.colsInput.value;
    this.bagValue.textContent = this.bagInput.value;
  }
};

