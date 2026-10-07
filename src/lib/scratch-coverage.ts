export interface ScratchPoint {x:number;y:number}

export class ScratchCoverage {
  private readonly cleared=new Set<number>();
  erase(from:ScratchPoint,to:ScratchPoint,radius=34):number {
    const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;
    for(let row=0;row<28;row++)for(let col=0;col<48;col++){
      const x=(col+.5)*15,y=(row+.5)*15;
      const t=length?Math.max(0,Math.min(1,((x-from.x)*dx+(y-from.y)*dy)/length)):0;
      if((x-from.x-t*dx)**2+(y-from.y-t*dy)**2<=radius*radius)this.cleared.add(row*48+col);
    }
    return this.cleared.size/(48*28);
  }
}
