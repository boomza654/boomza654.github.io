// console.log(elkjs);

// import {ELK} from 'elkjs/lib/elk.bundled';
console.log(ELK);
const elk = new ELK();

const graph = {
  id: "root",
  layoutOptions: { 'elk.algorithm': 'layered' },
  children: [
    { id: "n1", width: 30, height: 30 , ports : [{id:"p1n1"}, {id:"p2n1"}]},
    { id: "n2", width: 30, height: 30 },
    { id: "n3", width: 30, height: 30 }
  ],
  edges: [
    { id: "e1", sources: [ "p1n1" ], targets: [ "n2" ] },
    { id: "e2", sources: [ "p1n1" ], targets: [ "n3" ] }
  ]
}

elk.layout(graph)
   .then(console.log)
   .catch(console.error)

export {Game} from "./game.js";