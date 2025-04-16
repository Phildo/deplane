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
  for(var i = 0; i < sims.length; ++i)
    sims[i].reset();
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
  //sims[i] = new Sim(i, MODE_SELFISH, new SimEl("Selfish", ""+i)); ++i;
  sims[i] = new Sim(i, MODE_COLUMNNEAT, new SimEl("Columnar", ""+i)); ++i;
  resetSimulations();
});
