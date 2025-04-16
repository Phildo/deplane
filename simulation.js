var ENUM;

ENUM = 0;
var MODE_SELFISH = ENUM++;
var MODE_COLUMNNEAT = ENUM++;

ENUM = 0;
var SITTING   = ENUM++;
var ROWLEAVE  = ENUM++;
var ENTERISLE = ENUM++;
var GETBAG    = ENUM++;
var WALKISLE  = ENUM++;
var DONE      = ENUM++;

function lerp(a,b,t) { return a+(b-a)*t; }

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
  dismissed = false;
  blocked = false;

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

  exited = 0;
  exitedcols = null;
  exitedrows = null;

  index = 0;
  mode = 0;
  simel = null;

  ctx = null;
  canvas = null;
  outertick = null;
  animFrame = null;

  chairs = null;
  passengers = null;

  speed = 0;
  rows = 0;
  cols = 0;
  bag = 0;

  chairWidth = 0;
  chairHeight = 0;
  aisleWidth = 0;

  colx(col)
  {
      if(col < this.cols) return this.canvas.width/2 - this.aisleWidth/2 - this.chairWidth*this.cols + col            *this.chairWidth + this.chairWidth/2;
      else                return this.canvas.width/2 + this.aisleWidth/2                             + (col-this.cols)*this.chairWidth + this.chairWidth/2;
  }
  rowy(row)
  {
    return this.chairHeight + row*this.chairHeight + this.chairHeight/2;
  }

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
    this.speed = dom.speed();
    this.rows = dom.rows();
    this.cols = dom.cols();
    this.bagget = dom.bagget();
    this.rowwalk = dom.rowwalk();
    this.aislewalk = dom.aislewalk();

    this.chairWidth = this.canvas.width / (this.cols * 2 + 3); 
    this.chairHeight = this.canvas.height / (this.rows + 2);
    this.chairWidth = this.chairWidth < this.chairHeight ? this.chairWidth : this.chairHeight;
    this.aisleWidth = this.chairWidth;

    this.running = false;
    this.complete = false;
    this.exited = 0;
    this.exitedcols = [];
    for(var i = 0; i < this.cols*2; ++i) this.exitedcols[i] = 0;
    this.exitedrows = [];
    for(var i = 0; i < this.rows; ++i) this.exitedrows[i] = 0;
        
    if(this.animFrame) cancelAnimationFrame(this.animFrame);
        
    this.iterations = 0;
        
    this.simel.status.textContent = "Ready";
    this.simel.iterations.textContent = "0";
    this.simel.time.textContent = "0";

    this.chairs = [];

    for(var row = 0; row < this.rows; ++row)
    {
      var y = this.rowy(row)-this.chairHeight/2+this.chairHeight*0.05;
            
      //left
      for(var col = 0; col < this.cols; ++col)
      {
        var x = this.colx(col)-this.chairWidth/2+this.chairWidth*0.05;
        this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, col));
      }
            
      //right
      for(var col = 0; col < this.cols; ++col)
      {
        var x = this.colx(this.cols+col)-this.chairWidth/2+this.chairWidth*0.05;
        this.chairs.push(new Chair(x, y, this.chairWidth * 0.9, this.chairHeight * 0.9, row, this.cols+col));
      }
    }

    this.passengers = [];
    var passengerRadius = Math.min(this.chairWidth, this.chairHeight) * 0.3;
    for(var i = 0; i < this.chairs.length; ++i)
    {
      var chair = this.chairs[i];
      var x = this.colx(chair.col);
      var y = this.rowy(chair.row)
      this.passengers.push(new Passenger(x, y, passengerRadius, chair.row, chair.col));
    }

    switch(this.mode)
    {
      case MODE_SELFISH:
        for(var i = 0; i < this.passengers.length; ++i) this.passengers[i].dismissed = true;
        break;
      case MODE_COLUMNNEAT:
        for(var i = 0; i < this.passengers.length; ++i) if(this.passengers[i].col == this.cols-1) this.passengers[i].dismissed = true;
        break;
    }

    this.draw();
  }
      
  sim()
  {
    for(var i = 0; i < this.passengers.length; ++i)
    {
      var passenger = this.passengers[i];

      switch(passenger.state)
      {
        case SITTING:
          if(passenger.dismissed)
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
            passenger.x += dir*this.rowwalk*this.chairWidth/20;
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
            passenger.x += dir*this.rowwalk*this.chairWidth/20;
            if(dir*(passenger.x - (this.canvas.width/2))>=0)
            {
              passenger.x = this.canvas.width/2;
              passenger.state = GETBAG;
              passenger.tstate = 0;
            }
          }
          break;
        case GETBAG:
          if(passenger.tstate >= this.bagget)
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
            passenger.y -= this.aislewalk*this.chairHeight/20;
            if(passenger.y <= 0)
            {
              passenger.y = 0;
              passenger.state = DONE;
              passenger.tstate = 0;
              this.exited++;
              this.exitedcols[passenger.col]++;
              this.exitedrows[passenger.row]++;
              if(this.mode == MODE_COLUMNNEAT && this.exitedcols[passenger.col] == this.rows && this.exited < this.rows*(this.cols*2))
              {
                var col = passenger.col;
                if(col < this.cols) col = this.cols-(col+1)+this.cols;
                else                col = this.cols-(col-this.cols+2);
                for(var i = 0; i < this.passengers.length; ++i) if(this.passengers[i].col == col) this.passengers[i].dismissed = true;
              }
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
    for(var i = 0; i < this.chairs.length; ++i)
    {
      var chair = this.chairs[i];
      this.ctx.strokeRect(chair.x, chair.y, chair.w, chair.h);
      //this.ctx.fillText(`${chair.row},${chair.col}`, chair.x + 3, chair.y + 12);
    }

    //passengers
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    for(var i = 0; i < this.passengers.length; ++i)
    {
      var passenger = this.passengers[i];
      var sat = "80%";
      if(passenger.blocked) sat = "40%";
      var passcolor = `hsl(20, ${sat}, 50%)`;
      switch(passenger.state)
      {
        case SITTING:    passcolor = `hsl(20, ${sat}, 50%)`; break; //orange
        case ROWLEAVE:   passcolor = `hsl(60, ${sat}, 50%)`; break; //yellow
        case ENTERISLE:  passcolor = `hsl(60, ${sat}, 50%)`; break; //also yellow
        case GETBAG:     passcolor = `hsl(10, ${sat}, 50%)`; break; //red
        case WALKISLE:   passcolor = `hsl(100, ${sat}, 50%)`; break; //green
        //case DONE:       passcolor = `hsl(0,  ${sat}, 50%)`; break; //red
      }

      if(passenger.state != DONE)
      {
        this.ctx.fillStyle = passcolor;
        this.ctx.beginPath();
        this.ctx.arc(passenger.x, passenger.y, passenger.r, 0, Math.PI*2);
        this.ctx.fill();
          
        this.ctx.stroke();

        if(passenger.state == GETBAG)
        {
          this.ctx.fillStyle = `hsl(30, 40%, 20%)`;
          if(passenger.col < this.cols)
          {
            this.ctx.beginPath();
            this.ctx.arc(lerp(this.colx(this.cols-1),passenger.x,passenger.tstate/this.bagget), passenger.y, passenger.r*0.6, 0, Math.PI*2);
            this.ctx.fill();
          }
          else
          {
            this.ctx.beginPath();
            this.ctx.arc(lerp(this.colx(this.cols),passenger.x,passenger.tstate/this.bagget), passenger.y, passenger.r*0.6, 0, Math.PI*2);
            this.ctx.fill();
          }
        }
        else if(passenger.state == WALKISLE)
        {
          this.ctx.fillStyle = `hsl(30, 40%, 20%)`;
          this.ctx.beginPath();
          this.ctx.arc(passenger.x-passenger.r/2.0, passenger.y, passenger.r*0.6, 0, Math.PI*2);
          this.ctx.fill();
        }

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
      this.simel.status.textContent = "Complete";
      this.simel.time.textContent = Math.round(this.endTime - this.startTime);
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
