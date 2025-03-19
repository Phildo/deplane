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
    
    // Set initial displayed values
    speedValue.textContent = speedInput.value;
    rowsValue.textContent = rowsInput.value;
    colsValue.textContent = colsInput.value;
    bagValue.textContent = bagInput.value;

    class Chair {
      x = 0;
      y = 0;
      w = 0;
      h = 0;
      row = 0;
      col = 0;
      constructor(_x, _y, _w, _h, _row, _col)
      {
        this.x = _x;
        this.y = _y;
        this.w = _w;
        this.h = _h;
        this.row = _row;
        this.col = _col;
      }
    }

    var ENUM = 0;
    const SITTING   = ENUM++;
    const ROWLEAVE  = ENUM++;
    const ENTERISLE = ENUM++;
    const GETBAG    = ENUM++;
    const WALKISLE  = ENUM++;
    const DONE      = ENUM++;

    class Passenger {
      state = SITTING;
      tstate = 0;
      paused = false;
      x = 0;
      y = 0;
      r = 0;
      row = 0;
      col = 0;
      constructor(_x, _y, _r, _row, _col)
      {
        this.x = _x;
        this.y = _y;
        this.r = _r;
        this.row = _row;
        this.col = _col;
      }
    }

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
      mode = 0;

      chairs = null;
      passengers = null;

      constructor(_mode, _ctx, _canvas, _domStatus, _domIterations, _domTime, _outertick)
      {
        this.mode = _mode;
        this.ctx = _ctx;
        this.canvas = _canvas;
        this.domStatus = _domStatus;
        this.domIterations = _domIterations;
        this.domTime = _domTime;
        this.outertick = _outertick;
      }

      reset()
      {
          this.speed = parseInt(speedInput.value);
          this.rows = parseInt(rowsInput.value);
          this.cols = parseInt(colsInput.value);
          this.bag = parseInt(bagInput.value);

          this.chairWidth = this.canvas.width / (this.cols * 2 + 3); 
          this.chairHeight = this.canvas.height / (this.rows + 2);
          this.chairWidth = this.chairWidth < this.chairHeight ? this.chairWidth : this.chairHeight;
          this.aisleWidth = this.chairWidth;

          this.running = false;
          this.complete = false;
          this.exited = 0;
        
          if (this.animFrame) cancelAnimationFrame(this.animFrame);
        
          clearCanvas(this.ctx, this.canvas);
        
          this.iterations = 0;
        
          this.domStatus.textContent = "Ready";
          this.domIterations.textContent = "0";
          this.domTime.textContent = "0";

          this.chairs = [];
          const startY = this.chairHeight;

          // Create chairs on both sides of the aisle with margin on sides
          for(let row = 0; row < this.rows; ++row) {
            var y = startY + row*this.chairHeight;
            y += this.chairHeight*0.05;
            
            // Left side chairs (after left margin)
            for(let col = 0; col < this.cols; ++col) {
              var x = this.canvas.width/2 - this.aisleWidth/2 - this.chairWidth*this.cols + col*this.chairWidth;
              x += this.chairWidth*0.05;
              this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, col));
            }
            
            // Right side chairs (after aisle)
            for(let col = 0; col < this.cols; ++col) {
              var x = this.canvas.width/2 + this.aisleWidth/2 + col*this.chairWidth;
              x += this.chairWidth*0.05;
              this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, col + this.cols));
            }
          }

          // Initialize passengers for each chair
          this.passengers = [];
          for(let i = 0; i < this.chairs.length; ++i) {
            const chair = this.chairs[i];
            // Position passenger at the center of their chair
            const passengerRadius = Math.min(this.chairWidth, this.chairHeight) * 0.3;
            const x = chair.x + chair.w / 2;
            const y = chair.y + chair.h / 2;
            this.passengers.push(new Passenger(x, y, passengerRadius, chair.row, chair.col));
          }
      }
      
      sim()
      {
        var colsleft = Math.floor(this.exited/this.rows);
        var colcalled = 0;
        if(colsleft%2 == 0) colcalled = this.cols-1-colsleft/2;
        else                colcalled = this.cols+(colsleft-1)/2;

        for(let i = 0; i < this.passengers.length; ++i)
        {
          const passenger = this.passengers[i];

          switch(passenger.state)
          {
            case SITTING:
              if(this.mode == 0 || colcalled == passenger.col)
              {
                passenger.state = ROWLEAVE;
                passenger.tstate = 0;
              }
              break;
            case ROWLEAVE:
              passenger.blocked = false;
              var opassengerinisle = false;
              var dir = 1;
              if(passenger.col >= this.cols) dir = -1;
              for(let j = 0; j < this.passengers.length; ++j)
              {
                if(j == i) continue;
                const opassenger = this.passengers[j];
                if(passenger.row == opassenger.row)
                {
                  if(opassenger.state == ENTERISLE || opassenger.state == GETBAG) opassengerinisle = true;
                  if(passenger.col < this.cols)
                  {
                    if(opassenger.x > passenger.x && opassenger.x <= passenger.x+passenger.r*2)
                      passenger.blocked = true;
                  }
                  else if(passenger.col >= this.cols)
                  {
                    if(opassenger.x < passenger.x && opassenger.x >= passenger.x-passenger.r*2)
                      passenger.blocked = true;
                  }
                }
              }
              if(!passenger.blocked)
              {
                passenger.x += dir*1;
                if(dir*(passenger.x - (this.canvas.width/2 - dir*this.chairWidth))>=0)
                {
                  passenger.x = this.canvas.width/2 - dir*this.chairWidth;
                  if(!opassengerinisle)
                  {
                    passenger.state = ENTERISLE;
                    passenger.tstate = 0;
                  }
                  else passenger.blocked = true;
                }
              }
              break;
            case ENTERISLE:
              passenger.blocked = false;
              var dir = 1;
              if(passenger.col >= this.cols) dir = -1;
              for(let j = 0; j < this.passengers.length; ++j)
              {
                if(j == i) continue;
                const opassenger = this.passengers[j];
                if(passenger.row == opassenger.row)
                {
                  if(opassenger.state == WALKISLE && opassenger.y >= passenger.y-passenger.r*2) passenger.blocked = true;
                }
              }
              if(!passenger.blocked)
              {
                passenger.x += dir*1;
                if(dir*(passenger.x - (this.canvas.width/2))>=0)
                {
                  passenger.x = this.canvas.width/2;
                  passenger.state = GETBAG;
                  passenger.tstate = 0;
                }
              }
              break;
            case GETBAG:
              if(passenger.tstate >= 100)
              {
                passenger.state = WALKISLE;
                passenger.tstate = 0;
              }
              break;
            case WALKISLE:
              passenger.blocked = false;
              for(let j = 0; j < this.passengers.length; ++j)
              {
                if(j == i) continue;
                const opassenger = this.passengers[j];
                if(passenger.row >= opassenger.row)
                {
                  if(opassenger.state == ENTERISLE || opassenger.state == GETBAG || opassenger.state == WALKISLE)
                  {
                    if(opassenger.y < passenger.y && opassenger.y >= passenger.y-passenger.r*2)
                      passenger.blocked = true;
                  }
                }
              }
              if(!passenger.blocked)
              {
                passenger.y -= 1;
                if(passenger.y <= 0)
                {
                  passenger.y = 0;
                  passenger.state = DONE;
                  passenger.tstate = 0;
                  this.exited++;
                }
              }
              break;
            case DONE: ; break;
          }
          passenger.tstate++;

        }

        // Draw aisle
        this.ctx.fillStyle = "#e0e0e0";
        this.ctx.fillRect(this.canvas.width/2-this.aisleWidth/2, 0, this.aisleWidth, this.canvas.height);

        // Draw chairs
        this.ctx.strokeStyle = "#404040";
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = "#000000";
        this.ctx.font = "10px Arial";
        for(let i = 0; i < this.chairs.length; ++i) {
          const chair = this.chairs[i];
          this.ctx.strokeRect(chair.x, chair.y, chair.w, chair.h);
          this.ctx.fillText(`${chair.row},${chair.col}`, chair.x + 3, chair.y + 12);
        }
        
        // Draw passengers
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1;
        for(let i = 0; i < this.passengers.length; ++i)
        {
          const passenger = this.passengers[i];
          var sat = "80%";
          if(passenger.blocked) sat = "40%";
          switch(passenger.state)
          {
            case SITTING:    this.ctx.fillStyle = `hsl(20, ${sat}, 50%)`; break; //orange
            case ROWLEAVE:   this.ctx.fillStyle = `hsl(60, ${sat}, 50%)`; break; //yellow
            case ENTERISLE:  this.ctx.fillStyle = `hsl(220, ${sat}, 50%)`; break; //blue
            case GETBAG:     this.ctx.fillStyle = `hsl(10, ${sat}, 50%)`; break; //red
            case WALKISLE:   this.ctx.fillStyle = `hsl(100, ${sat}, 50%)`; break; //green
            //case DONE:       this.ctx.fillStyle = `hsl(0,  ${sat}, 50%)`; break; //red
          }
          
          if(passenger.state != DONE)
          {
            this.ctx.beginPath();
            this.ctx.arc(passenger.x, passenger.y, passenger.r, 0, Math.PI * 2);
            this.ctx.fill();
          
            this.ctx.stroke();
          }
        }

        return (this.exited == this.cols*2*this.rows);
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
      // Reset both simulations with same parameters
      simA.reset();
      simB.reset();
      
      // Clear results
      results.textContent = "";
      
      // Draw initial state
      simA.sim();
      simB.sim();
    }
    resetBtn.addEventListener('click', resetSimulations);

    // Start simulations
    startBtn.addEventListener('click', () => {
        if (simA.running || simB.running) return;
        
        resetSimulations();
        
        simA.start();
        simB.start();
    });

    var simA = new Sim(0, ctxA, canvasA, statusA, iterationsA, timeA, tickA);
    var simB = new Sim(1, ctxB, canvasB, statusB, iterationsB, timeB, tickB);
    
    // Initialize the simulations on page load
    resetSimulations();
});