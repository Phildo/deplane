function checkCompletion()
{
  var complete = true;
  for(var i = 0; i < sims.length; ++i)
  {
    if(!sims[i].complete) complete = false;
  }

  if(complete)
  {
    var fastest = sims.length;
    var fastestTime = 999999999999999999;
    for(var i = 0; i < sims.length; ++i)
    {
      var elapsed = sims[i].endTime - sims[i].startTime;
      if(elapsed < fastestTime)
      {
        fastest = i;
        fastestTime = elapsed;
      }
    }

    dom.results.textContent = sims[i].simel.title + ` finished fastest: ${fastestTime}ms`;
  }
}

function getbag(variance, row)
{
  switch(variance)
  {
    case 0: return 0;
    case 1: if(Math.random() < 0.2) return -1;
    case 2:
      if(Math.random() < 0.3)
      {
        if(Math.random() < 0.5) return -1;
        else return Math.floor(Math.random()*Math.min(row,3));
      }
      return 0;
    case 3:
      if(Math.random() < 0.4)
      {
        if(Math.random() < 0.3) return -1;
        else return Math.floor(Math.random()*Math.min(row,7));
      }
      return 0;
    case 4:
      if(Math.random() < 0.6)
      {
        if(Math.random() < 0.2) return -1;
        else return Math.floor(Math.random()*Math.min(row,20));
      }
      return 0;
    case 5:
      if(Math.random() < 0.1) return -1;
      else return Math.floor(Math.random()*row);
      return 0;
  }
  return 0;
}
function resetSimulations()
{
  var rows = dom.rows();
  var cols = dom.cols();
  var pctdefectors = dom.pctdefectors();
  var bagvariance = dom.bagvariance();
  var families = dom.families();

  var pparams = [];

  for(var row = 0; row < rows; ++row)
  {
    //left
    for(var col = 0; col < cols; ++col)
      pparams.push(new PassengerParams(getbag(bagvariance, row),Math.random()<pctdefectors));
    //right
    for(var col = 0; col < cols; ++col)
      pparams.push(new PassengerParams(getbag(bagvariance, row),Math.random()<pctdefectors));
  }

  for(var i = 0; i < sims.length; ++i)
    sims[i].reset(pparams);
  dom.results.textContent = "";
}

function startSimulations()
{
  var running = false;
  for(var i = 0; i < sims.length; ++i)
    if(sims[i].running) running = true;
        
  if(!running)
  {
    resetSimulations();
    for(var i = 0; i < sims.length; ++i)
      sims[i].start();
  }
}

var dom = new DOM();
var sims = [];
document.addEventListener('DOMContentLoaded', () =>
{
  dom.init();

  var i = 0;
  sims[i] = new Sim(i, MODE_SELFISH,    new SimEl("Selfish",  ""+i)); ++i;
  sims[i] = new Sim(i, MODE_COLUMNNEAT, new SimEl("Columnar", ""+i)); ++i;
  resetSimulations();
});
