// Une portée pédagogique pour les mélodies intégrées en Do majeur, à une voix.
// Les notes sont réparties dans des mesures de quatre temps, sans importer de fichier.
const steps={0:0,2:1,4:2,5:3,7:4,9:5,11:6};
export function staffY(note){return 112-6*((Math.floor(note/12)-5)*7+steps[note%12]);}
export function measuresFor(notes,beats){let time=0;const measures=[];notes.forEach((note,index)=>{const bar=Math.floor(time/4);(measures[bar]||=[]).push({note,index,beat:time%4,duration:beats[index]});time+=beats[index];});return measures;}
const ns='http://www.w3.org/2000/svg';
function element(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;}
export function drawScore(container,lesson,position,showNames,start=0,end=lesson.notes.length){container.replaceChildren();
  measuresFor(lesson.notes,lesson.beats).forEach((bar,i)=>{
    const svg=element('svg',{viewBox:'0 0 300 160',role:'img','aria-label':`Mesure ${i+1} : ${bar.map(n=>n.index<position?'note jouée':n.index===position?'note attendue':'note à venir').join(', ')}`});
    svg.append(element('title',{},`${lesson.title} · mesure ${i+1}`));
    for(let y=52;y<=100;y+=12)svg.append(element('line',{x1:12,x2:288,y1:y,y2:y,stroke:'#a79caf','stroke-width':1}));
    svg.append(element('text',{x:14,y:98,'font-size':57,'font-family':'Georgia,serif',fill:'#50415b'},'𝄞'));
    if(i===0){svg.append(element('text',{x:47,y:72,'font-size':19},'4'));svg.append(element('text',{x:47,y:95,'font-size':19},'4'));}
    svg.append(element('text',{x:12,y:20,'font-size':11,fill:'#706377'},`Mesure ${i+1}`));
    svg.append(element('line',{x1:288,x2:288,y1:52,y2:100,stroke:'#655080'}));
    for(const item of bar){const x=78+item.beat*49,y=staffY(item.note),done=item.index>=start&&item.index<position&&item.index<end,current=item.index===position&&item.index<end,color=done?'#33735a':current?'#76529a':'#403549';
      const group=element('g',{'data-score-index':item.index,class:current?'score-current':done?'score-done':''});
      if(current)group.append(element('rect',{x:x-17,y:30,width:34,height:105,rx:10,fill:'#eee3fa',stroke:'#76529a','stroke-dasharray':'3 2'}));
      if(y>=112)for(let ledger=112;ledger<=y;ledger+=12)group.append(element('line',{x1:x-13,x2:x+13,y1:ledger,y2:ledger,stroke:color}));
      if(y<=40)for(let ledger=40;ledger>=y;ledger-=12)group.append(element('line',{x1:x-13,x2:x+13,y1:ledger,y2:ledger,stroke:color}));
      group.append(element('ellipse',{cx:x,cy:y,rx:8,ry:5.5,transform:`rotate(-18 ${x} ${y})`,fill:item.duration>=2?'white':color,stroke:color,'stroke-width':2}));
      const down=y<76,stemX=x+(down?-7:7),stemEnd=y+(down?32:-32);group.append(element('line',{x1:stemX,x2:stemX,y1:y,y2:stemEnd,stroke:color,'stroke-width':2}));
      if(item.duration===.5)group.append(element('path',{d:down?`M ${stemX} ${stemEnd} q -15 -7 -5 -20`:`M ${stemX} ${stemEnd} q 15 7 5 20`,fill:'none',stroke:color,'stroke-width':3}));
      if(item.duration===1.5)group.append(element('circle',{cx:x+15,cy:y-2,r:2.5,fill:color}));
      if(showNames)group.append(element('text',{x,y:146,'text-anchor':'middle','font-size':11,fill:color},['Do','','Ré','','Mi','Fa','','Sol','','La','','Si'][item.note%12]+(Math.floor(item.note/12)-1)));
      svg.append(group);
    }container.append(svg);
  });
}
