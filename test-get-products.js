const res = await fetch('http://localhost:3001/api/products');
const json = await res.json();
console.log(JSON.stringify(json.data[json.data.length - 1], null, 2));
