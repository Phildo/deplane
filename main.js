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

    results.textContent = sims[i].title + ` finished fastest: ${fastestTime}ms`;
  }
}

function resetSimulations()
{
  var rows = dom.rows();
  var cols = dom.cols();
  var pctdefectors = dom.pctdefectors();

  var pparams = [];

  for(var row = 0; row < rows; ++row)
  {
    //left
    for(var col = 0; col < cols; ++col)
      pparams.push(new PassengerParams(0,Math.random()<pctdefectors));
    //right
    for(var col = 0; col < cols; ++col)
      pparams.push(new PassengerParams(0,Math.random()<pctdefectors));
  }

  for(var i = 0; i < sims.length; ++i)
    sims[i].reset(pparams);
  results.textContent = "";
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
