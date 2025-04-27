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
  dismissed = false;
  tfinished = 0;

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

class PassengerParams
{
  speed = 1;
  bag = 0; //-1 = none, else delta from row
  defector = false;
  family = 0;

  constructor(_speed, _bag, _defector, _family)
  {
    this.speed = _speed;
    this.bag = _bag;
    this.defector = _defector;
    this.family = _family;
  }
}

class Passenger
{
  pparams = null;
  chair = null;
  state = SITTING;
  tstate = 0;
  dismissed = false;
  blocked = false;
  hasbag = false;

  x = 0;
  y = 0;
  r = 0;

  constructor(_pparams, _chair, _r)
  {
    this.pparams = _pparams;
    this.chair = _chair;
    this.x = this.chair.x+this.chair.w/2;
    this.y = this.chair.y+this.chair.h/2;
    this.r = _r;
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
  pparams = null;

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

  reset(_pparams)
  {
    if(this.animFrame) cancelAnimationFrame(this.animFrame);

    this.rows = dom.rows();
    this.cols = dom.cols();
    this.bagget = dom.bagget();
    this.rowwalk = dom.rowwalk();
    this.aislewalk = dom.aislewalk();

    this.chairWidth = this.canvas.width / (this.cols * 2 + 3); 
    this.chairHeight = this.canvas.height / (this.rows + 2);
    this.chairWidth = this.chairWidth < this.chairHeight ? this.chairWidth : this.chairHeight;
    this.aisleWidth = this.chairWidth;

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

    this.pparams = _pparams;
    this.passengers = [];
    var passengerRadius = Math.min(this.chairWidth, this.chairHeight) * 0.3;
    for(var i = 0; i < this.chairs.length; ++i)
    {
      var chair = this.chairs[i];
      this.passengers.push(new Passenger(this.pparams[i], chair, passengerRadius));
    }

    this.running = false;
    this.complete = false;
    this.exited = 0;
    this.exitedcols = [];
    for(var i = 0; i < this.cols*2; ++i) this.exitedcols[i] = 0;
    this.exitedrows = [];
    for(var i = 0; i < this.rows; ++i) this.exitedrows[i] = 0;
        
    this.iterations = 0;
        
    for(var i = 0; i < this.passengers.length; ++i) if(this.pparams[i].defector) this.dismiss(i);
    switch(this.mode)
    {
      case MODE_SELFISH:
        for(var i = 0; i < this.passengers.length; ++i) { this.dismiss(i); this.passengers[i].chair.dismissed = true; }
        break;
      case MODE_COLUMNNEAT:
        for(var i = 0; i < this.passengers.length; ++i) if(this.passengers[i].chair.col == this.cols-1) { this.dismiss(i); this.passengers[i].chair.dismissed = true; }
        break;
    }

    this.simel.status.textContent = "Ready";
    this.simel.iterations.textContent = "0";
    this.simel.time.textContent = "0";

    this.draw();
  }
      
  dismiss(i)
  {
    var passenger = this.passengers[i];
    passenger.dismissed = true;
    if(passenger.pparams.family)
    {
      var fro = Math.max(0,i-this.cols*2);
      var to = Math.min(i+this.cols*2,this.rows*(this.cols*2));
      for(var j = fro; j < to; ++j)
      {
        var opassenger = this.passengers[j];
        if(opassenger.pparams.family == passenger.pparams.family)
        {
          opassenger.dismissed = true;
        }
      }
    }
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
          if(passenger.chair.col >= this.cols) dir = -1;
          for(var j = 0; j < this.passengers.length; ++j)
          {
            if(j == i) continue;
            var opassenger = this.passengers[j];
            if(passenger.chair.row == opassenger.chair.row)
            {
              if(opassenger.state == ENTERISLE || opassenger.state == GETBAG) opassengerinisle = true;
              if(passenger.chair.col < this.cols)
              {
                if(opassenger.x > passenger.x && opassenger.x <= passenger.x+passenger.r*2)
                  passenger.blocked = true;
              }
              else if(passenger.chair.col >= this.cols)
              {
                if(opassenger.x < passenger.x && opassenger.x >= passenger.x-passenger.r*2)
                  passenger.blocked = true;
              }
            }
          }
          if(!passenger.blocked)
          {
            passenger.x += passenger.pparams.speed*dir*this.rowwalk*this.chairWidth/20;
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
          if(passenger.chair.col >= this.cols) dir = -1;
          for(var j = 0; j < this.passengers.length; ++j)
          {
            if(j == i) continue;
            var opassenger = this.passengers[j];
            if(passenger.chair.row == opassenger.chair.row)
            {
              if(opassenger.state == WALKISLE && opassenger.y >= passenger.y-passenger.r*2) passenger.blocked = true;
            }
          }
          if(!passenger.blocked)
          {
            passenger.x += passenger.pparams.speed*dir*this.rowwalk*this.chairWidth/20;
            if(dir*(passenger.x - (this.canvas.width/2))>=0)
            {
              passenger.x = this.canvas.width/2;
              if(passenger.pparams.bag == 0) passenger.state = GETBAG;
              else                           passenger.state = WALKISLE;
              passenger.tstate = 0;
            }
          }
          break;
        case GETBAG:
          if(passenger.tstate >= this.bagget)
          {
            passenger.hasbag = true;
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
            if(passenger.chair.row >= opassenger.chair.row)
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
            passenger.y -= passenger.pparams.speed*this.aislewalk*this.chairHeight/20;
            if(!passenger.hasbag && passenger.pparams.bag > 0)
            {
              var target = this.rowy(passenger.chair.row-passenger.pparams.bag);
              if(passenger.y <= target)
              {
                passenger.y = target;
                passenger.state = GETBAG;
                passenger.tstate = 0;
              }
            }
            else if(passenger.y <= 0)
            {
              passenger.y = 0;
              passenger.state = DONE;
              passenger.tstate = 0;
              passenger.chair.tfinished = this.iterations;
              this.exited++;
              this.exitedcols[passenger.chair.col]++;
              this.exitedrows[passenger.chair.row]++;
              if(this.mode == MODE_COLUMNNEAT && this.exitedcols[passenger.chair.col] == this.rows && this.exited < this.rows*(this.cols*2))
              {
                var col = passenger.chair.col;
                if(col < this.cols) col = this.cols-(col+1)+this.cols;
                else                col = this.cols-(col-this.cols+2);
                for(var i = 0; i < this.passengers.length; ++i) if(this.passengers[i].chair.col == col) { this.dismiss(i); this.passengers[i].chair.dismissed = true; }
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
    var biggestdiff = 0;
    if(this.index == 1)
    {
      var osim = sims[0];
      for(var i = 0; i < this.chairs.length; ++i)
      {
        var c = this.chairs[i];
        var oc = osim.chairs[i];
        if(c.tfinished && oc.tfinished && Math.abs(c.tfinished-oc.tfinished) > biggestdiff)
          biggestdiff = Math.abs(c.tfinished-oc.tfinished);
      }
    }
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "10px Arial";
    for(var i = 0; i < this.chairs.length; ++i)
    {
      var chair = this.chairs[i];
      if(chair.dismissed) { this.ctx.strokeStyle = "#408840"; this.ctx.lineWidth = 3; }
      else                { this.ctx.strokeStyle = "#404040"; this.ctx.lineWidth = 1; }

      if(biggestdiff > 0)
      {
        var c = this.chairs[i];
        var oc = osim.chairs[i];
        if(c.tfinished && oc.tfinished)
        {
          if(c.tfinished > oc.tfinished) this.ctx.fillStyle = "rgba(255,0,0,"+(c.tfinished-oc.tfinished)/biggestdiff+")";
          else                           this.ctx.fillStyle = "rgba(0,255,0,"+(oc.tfinished-c.tfinished)/biggestdiff+")";
          this.ctx.fillRect(chair.x, chair.y, chair.w, chair.h);
        }
        else if(this.complete)
        {
          this.ctx.fillStyle = "rgba(0,255,0,1)";
          this.ctx.fillRect(chair.x, chair.y, chair.w, chair.h);
        }
      }

      this.ctx.strokeRect(chair.x, chair.y, chair.w, chair.h);
      //this.ctx.fillStyle = "#000000";
      //this.ctx.fillText(`${chair.row},${chair.col}`, chair.x + 3, chair.y + 12);
    }

    //passengers
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

           if(passenger.pparams.defector) { this.ctx.strokeStyle = "#880000"; this.ctx.lineWidth = 3; }
      else if(passenger.dismissed)        { this.ctx.strokeStyle = "#008800"; this.ctx.lineWidth = 1; }
      else                                { this.ctx.strokeStyle = "#000000"; this.ctx.lineWidth = 1; }

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
          if(passenger.chair.col < this.cols)
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
        else if(passenger.state == WALKISLE && passenger.hasbag)
        {
          this.ctx.fillStyle = `hsl(30, 40%, 20%)`;
          this.ctx.beginPath();
          this.ctx.arc(passenger.x-passenger.r/2.0, passenger.y, passenger.r*0.6, 0, Math.PI*2);
          this.ctx.fill();
        }

      }
    }

    //families
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#000000";
    var lastfamily = 0;
    for(var i = 0; i < this.passengers.length; ++i)
    {
      var passenger = this.passengers[i];
      if(passenger.pparams.family > lastfamily)
      {
        lastfamily = passenger.pparams.family;
        var fro = Math.max(0,i-this.cols*2);
        var to = Math.min(i+this.cols*2,this.rows*(this.cols*2));
        this.ctx.beginPath();
        var first = false;
        for(var j = fro; j < to; ++j)
        {
          var opassenger = this.passengers[j];
          if(opassenger.pparams.family == lastfamily)
          {
            if(first) this.ctx.moveTo(opassenger.x,opassenger.y);
            else this.ctx.lineTo(opassenger.x,opassenger.y);
          }
        }
        this.ctx.stroke();
      }
    }
  }

  tick()
  {
    if(!this.running) { this.draw(); return; }

    var speed = dom.speed();
    var times = 1;
    switch(speed)
    {
      case 1: times = 1; break;
      case 2: times = 2; break;
      case 3: times = 4; break;
      case 4: times = 8; break;
      case 5: times = 16; break;
    }
    for(var i = 0; this.running && i < times; ++i) 
    {
      this.iterations++;
      this.simel.iterations.textContent = this.iterations;
        
      var now = performance.now();
      var elapsed = now - this.startTime;
      this.simel.time.textContent = Math.round(elapsed);
        
      if (this.sim())
      {
        this.endTime = performance.now();
        this.running = false;
        this.complete = true;
        this.simel.status.textContent = "Complete";
        this.simel.time.textContent = Math.round(this.endTime - this.startTime);
        checkCompletion();
      }
    }

    this.draw();
    if(this.running) this.animFrame = requestAnimationFrame(this.outertick);
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
