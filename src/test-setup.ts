import {products, type Product, type Tone} from './model';

// Test-only fixtures. Production starts with no built-in products.
const rows: [string,string,number,Tone][] = [
  ['بسكويت حليب · علبة','starters',8000,'pink'],
  ['حبوب إفطار بالشوكولاتة','pizza',14000,'purple'],
  ['كيك فانيلا · عبوة','dessert',7000,'cyan'],
  ['رقائق بطاطس · عبوة عائلية','starters',10000,'pink'],
  ['شوفان بالعسل · علبة','pizza',16000,'purple'],
  ['بسكويت شوكولاتة','dessert',6000,'cyan'],
  ['فشار بالجبن','starters',5000,'pink'],
  ['زبدة فول سوداني','pizza',15000,'purple'],
  ['ويفر بالفانيلا','dessert',6500,'cyan'],
  ['عصير تفاح · 200 مل','soda',2000,'green'],
  ['مناديل أطفال','beer',5000,'blue'],
  ['شامبو أطفال','beer',4500,'blue'],
  ['أقلام تلوين','wine',7000,'neutral'],
  ['دفتر رسم','wine',7000,'red'],
  ['حقيبة مدرسية','wine',30000,'red'],
  ['حليب أطفال · عبوة','burger',10000,'blue'],
  ['زبادي فراولة · عبوة','burger',8500,'blue'],
  ['كراكرز بالجبن','starters',3500,'pink'],
  ['معجون أسنان أطفال','hot',3000,'sand'],
  ['فرشاة أسنان أطفال','hot',1500,'sand'],
  ['مياه شرب · 330 مل','soda',2000,'green'],
];

const fixtures: Product[] = rows.map(([name,category,price,tone],index)=>({
  id:`p${index+1}`,name,category,price,cost:Math.round(price*.7),tone,
  barcode:`100${String(index+1).padStart(3,'0')}`,tax:10,stock:24+((index*17)%73),
  discountable:true,available:true,custom:true,
}));

products.unshift(...fixtures);
