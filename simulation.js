document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const rowsInput = document.getElementById('rows');
    const rowsValue = document.getElementById('rowsValue');
    const colsInput = document.getElementById('cols');
    const colsValue = document.getElementById('colsValue');
    const bagInput = document.getElementById('bag');
    const bagValue = document.getElementById('bagValue');
    
    const canvasA = document.getElementById('canvasA');
    const ctxA = canvasA.getContext('2d');
    const statusA = document.getElementById('statusA');
    const iterationsA = document.getElementById('iterationsA');
    const timeA = document.getElementById('timeA');
    
    const canvasB = document.getElementById('canvasB');
    const ctxB = canvasB.getContext('2d');
    const statusB = document.getElementById('statusB');
    const iterationsB = document.getElementById('iterationsB');
    const timeB = document.getElementById('timeB');
    
    const results = document.getElementById('results');

    // Update displayed values
    speedInput.addEventListener('input', () => {
        speedValue.textContent = speedInput.value;
    });
    rowsInput.addEventListener('input', () => {
        rowsValue.textContent = rowsInput.value;
    });
    colsInput.addEventListener('input', () => {
        colsValue.textContent = colsInput.value;
    });
    bagInput.addEventListener('input', () => {
        bagValue.textContent = bagInput.value;
    });
    
    speedValue.textContent = speedInput.value;

    class Sim {
      running = false;
      complete = false;
      iterations = 0;
      startTime = 0;
      endTime = 0;
      animFrame = null;
      ctx = null;
      canvas = null;
      domStatus = null;
      domIterations = null;
      domTime = null;
      outertick = null;

      chairs = null;
      passengers = null;

      class Chair {
        x = 0;
        y = 0;
        w = 0;
        h = 0;
        constructor(_x, _y, _w, _h)
        {
          this.x = _x;
          this.y = _y;
          this.w = _w;
          this.h = _h;
        }
      }

      class Passenger {
        x = 0;
        y = 0;
        r = 0;
        constructor(_x, _y, _r)
        {
          this.x = _x;
          this.y = _y;
          this.r = _r;
        }
      }

      constructor(_ctx, _canvas, _domStatus, _domIterations, _domTime, _outertick) {
        this.ctx = _ctx;
        this.canvas = _canvas;
        this.domStatus = _domStatus;
        this.domIterations = _domIterations;
        this.domTime = _domTime;
        this.outertick = _outertick;

      }

      reset() {
          this.running = false;
          this.complete = false;
        
          if (this.animFrame) cancelAnimationFrame(this.animFrame);
        
          clearCanvas(this.ctx, this.canvas);
        
          this.iterations = 0;
        
          this.domStatus.textContent = "Ready";
          this.domIterations.textContent = "0";
          this.domTime.textContent = "0";

          this.speed = parseInt(speedInput.value);
          this.rows = parseInt(rowsInput.value);
          this.cols = parseInt(colsInput.value);
          this.bag = parseInt(bagInput.value);

          this.chairs = [];
          for(var x = 0; x < this.rows; ++x)
          {
          }

          this.passengers = [];
      }
      
      sim() {
        var x = Math.random() * this.canvas.width;
        var y = Math.random() * this.canvas.height;
        var size = Math.random() * 5 + 2;
        var color = `hsl(${Math.random() * 360}, 70%, 50%)`;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        return false;
      }

      tick() {
          if (!this.running) return;
        
          this.iterations++;
          this.domIterations.textContent = this.iterations;
        
          const now = performance.now();
          const elapsed = now - this.startTime;
          this.domTime.textContent = Math.round(elapsed);
        
          clearCanvas(this.ctx, this.canvas);
        
          if (this.sim()) {
              this.endTime = performance.now();
              this.running = false;
              this.complete = true;
              this.domStatus.textContent = "Complete";
              this.domTime.textContent = Math.round(this.endTime - this.startTime);
              checkCompletion();
          } else {
              this.animFrame = requestAnimationFrame(this.outertick);
          }
      }

      start() {
        this.domStatus.textContent = "Running";
        this.running = true;
        this.complete = false;
        this.iterations = 0;
        
        this.startTime = performance.now();
        
        this.tick();
      }

    };
    function tickA() { simA.tick(); }
    function tickB() { simB.tick(); }

    // Clear canvas
    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Check if both simulations are complete
    function checkCompletion() {
        if (simA.complete && simB.complete) {
            const timeElapsedA = simA.endTime - simA.startTime;
            const timeElapsedB = simB.endTime - simB.startTime;
            
            let resultText = '';
            if (timeElapsedA < timeElapsedB) {
                resultText = `Simulation A finished faster by ${Math.round(timeElapsedB - timeElapsedA)} ms`;
            } else if (timeElapsedB < timeElapsedA) {
                resultText = `Simulation B finished faster by ${Math.round(timeElapsedA - timeElapsedB)} ms`;
            } else {
                resultText = 'Both simulations finished in the same time!';
            }
            
            results.textContent = resultText;
        }
    }
    
    function resetSimulations() {
      simA.reset();
      simB.reset();
      results.textContent = "";
    }
    resetBtn.addEventListener('click', resetSimulations);

    // Start simulations
    startBtn.addEventListener('click', () => {
        if (simA.running || simB.running) return;
        
        resetSimulations();
        
        simA.start();
        simB.start();
    });

    var simA = new Sim(ctxA, canvasA, statusA, iterationsA, timeA, tickA);
    var simB = new Sim(ctxB, canvasB, statusB, iterationsB, timeB, tickB);
});