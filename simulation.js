var ENUM;

ENUM = 0;
var MODE_DOGEATDOG = ENUM++;
var MODE_COLUMNNEAT = ENUM++;

ENUM = 0;
var SITTING   = ENUM++;
var ROWLEAVE  = ENUM++;
var ENTERISLE = ENUM++;
var GETBAG    = ENUM++;
var WALKISLE  = ENUM++;
var DONE      = ENUM++;

class Chair
{
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

class Passenger
{
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

class Sim
{
  running = false;
  complete = false;
  iterations = 0;
  startTime = 0;
  endTime = 0;
  animFrame = null;

  index = 0;
  mode = 0;
  simel = null;

  ctx = null;
  canvas = null;
  outertick = null;

  chairs = null;
  passengers = null;

  constructor(_index, _mode, _simel)
  {
    this.index = _index;
    this.mode = _mode;
    this.simel = _simel;

    this.ctx = this.simel.ctx;
    this.canvas = this.simel.canvas;
    this.outertick = function() { sims[_index].tick(); }
  }

  reset()
  {
    this.speed = parseInt(dom.speedInput.value);
    this.rows = parseInt(dom.rowsInput.value);
    this.cols = parseInt(dom.colsInput.value);
    this.bag = parseInt(dom.bagInput.value);

    this.chairWidth = this.canvas.width / (this.cols * 2 + 3); 
    this.chairHeight = this.canvas.height / (this.rows + 2);
    this.chairWidth = this.chairWidth < this.chairHeight ? this.chairWidth : this.chairHeight;
    this.aisleWidth = this.chairWidth;

    this.running = false;
    this.complete = false;
    this.exited = 0;
        
    if(this.animFrame) cancelAnimationFrame(this.animFrame);
        
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
    this.iterations = 0;
        
    this.simel.status.textContent = "Ready";
    this.simel.iterations.textContent = "0";
    this.simel.time.textContent = "0";

    this.chairs = [];
    var startY = this.chairHeight;

    // Create chairs on both sides of the aisle with margin on sides
    for(var row = 0; row < this.rows; ++row)
    {
      var y = startY + row*this.chairHeight;
      y += this.chairHeight*0.05;
            
      // Left side chairs (after left margin)
      for(var col = 0; col < this.cols; ++col)
      {
        var x = this.canvas.width/2 - this.aisleWidth/2 - this.chairWidth*this.cols + col*this.chairWidth;
        x += this.chairWidth*0.05;
        this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, col));
      }
            
      // Right side chairs (after aisle)
      for(var col = 0; col < this.cols; ++col)
      {
        var x = this.canvas.width/2 + this.aisleWidth/2 + col*this.chairWidth;
        x += this.chairWidth*0.05;
        this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, col + this.cols));
      }
    }

    // Initialize passengers for each chair
    this.passengers = [];
    for(var i = 0; i < this.chairs.length; ++i)
    {
      var chair = this.chairs[i];
      // Position passenger at the center of their chair
      var passengerRadius = Math.min(this.chairWidth, this.chairHeight) * 0.3;
      var x = chair.x + chair.w / 2;
      var y = chair.y + chair.h / 2;
      this.passengers.push(new Passenger(x, y, passengerRadius, chair.row, chair.col));
    }
  }
      
  sim()
  {
    var colsleft = Math.floor(this.exited/this.rows);
    var colcalled = 0;
    if(colsleft%2 == 0) colcalled = this.cols-1-colsleft/2;
    else                colcalled = this.cols+(colsleft-1)/2;

    for(var i = 0; i < this.passengers.length; ++i)
    {
      var passenger = this.passengers[i];

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
          for(var j = 0; j < this.passengers.length; ++j)
          {
            if(j == i) continue;
            var opassenger = this.passengers[j];
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
          for(var j = 0; j < this.passengers.length; ++j)
          {
            if(j == i) continue;
            var opassenger = this.passengers[j];
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
          for(var j = 0; j < this.passengers.length; ++j)
          {
            if(j == i) continue;
            var opassenger = this.passengers[j];
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

    return (this.exited == this.cols*2*this.rows);
  }

  draw()
  {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //aisle
    this.ctx.fillStyle = "#e0e0e0";
    this.ctx.fillRect(this.canvas.width/2-this.aisleWidth/2, 0, this.aisleWidth, this.canvas.height);

    //chairs
    this.ctx.strokeStyle = "#404040";
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "10px Arial";
    for(var i = 0; i < this.chairs.length; ++i) {
      var chair = this.chairs[i];
      this.ctx.strokeRect(chair.x, chair.y, chair.w, chair.h);
      this.ctx.fillText(`${chair.row},${chair.col}`, chair.x + 3, chair.y + 12);
    }
        
    //passengers
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    for(var i = 0; i < this.passengers.length; ++i)
    {
      var passenger = this.passengers[i];
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
  }

  tick()
  {
    if(!this.running) return;
        
    this.iterations++;
    this.simel.iterations.textContent = this.iterations;
        
    var now = performance.now();
    var elapsed = now - this.startTime;
    this.simel.time.textContent = Math.round(elapsed);
        
    if (this.sim())
    {
      this.draw();
      this.endTime = performance.now();
      this.running = false;
      this.complete = true;
      this.domStatus.textContent = "Complete";
      this.domTime.textContent = Math.round(this.endTime - this.startTime);
      checkCompletion();
    } else
    {
      this.draw();
      this.animFrame = requestAnimationFrame(this.outertick);
    }
  }

  start()
  {
    this.simel.textContent = "Running";
    this.running = true;
    this.complete = false;
    this.iterations = 0;
        
    this.startTime = performance.now();
        
    this.tick();
  }

};
