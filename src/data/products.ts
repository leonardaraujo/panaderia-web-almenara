
import cumple1 from "../assets/products/cumple_1.jpg"
import cumple2 from '../assets/products/cumple_2.jpg';
import cumple3 from '../assets/products/cumple_3.jpg';
import catering1 from '../assets/products/catering_1.jpg';
import catering2 from '../assets/products/catering_2.jpg';
import catering3 from '../assets/products/catering_3.jpg';
import torta1 from '../assets/products/torta_1.jpeg';
import torta2 from '../assets/products/torta_2.jpg';
import torta3 from '../assets/products/torta_3.jpg';
import box1 from '../assets/products/box_1.jpg';
import box2 from '../assets/products/box_2.jpg';
import box3 from '../assets/products/box_3.jpg';


const productos = {
	categorias: {
		birthday: [
			{
				name: "Party box",
				img: cumple1,
				text: "20 mini croissant rellenos de jamón y queso gouda + 20 petite con pollo cortadito con mayonesa de apio + 21 mini alfajores crocantes y rellenos de full manjar + 21 mini brownies amelcochados con pecanas y fudge.",
				price: 195.0,
			},
			{
				name: "Super box",
				img: cumple2,
				text: "20 mini croissant jamón y queso gouda + 20 petite pan de pollo cortadito con mayonesa de apio + 20 mini triples clásicos en pan mármol (huevo, palta y tomate)",
				price: 175.0,
			},
			{
				name: "Mini brownie box",
				img: cumple3,
				text: "42 amelcochados de chocolate y pecanas, bañados en fudge, chocolate rallado y líneas de ganache",
				price: 60.0,
			},
		],
		catering: [
			{
				name: "Box Reunidos",
				img: catering1,
				text: "Todos tus favoritos reunidos⭐. Contiene 20 mini croissants, 20 petit panes con pollo, 40 mini alfajores y 40 mini brownies.",
				price: 219.0,
			},
			{
				name: "Mini pollo box",
				img: catering2,
				text: "20 petite pan de pollo cortadito con mayonesa de apio casera.",
				price: 60.0,
			},
			{
				name: "Two box",
				img: catering3,
				text: "10 mini croissant jamón y queso gouda + 10 petite pan de pollo cortadito con mayonesa de apio casera.",
				price: 60.0,
			},
		],
		tortas: [
			{
				name: "La clásica torta de chocolate",
				img: torta1,
				text: "La favorita, con la que empezó toda mi historia. La aman porque es suave, húmeda, rellena de una capa de fudge y una de manjar, cubierta con ganache y fudge casero. Foto referencial*",
				price: 109.0,
			},
			{
				name: "Carrot cake 12pzs",
				img: torta2,
				text: "Tres capas de nuestro suave bizcochuelo de zanahoria con pecanas y especias, relleno y cubierto de frosting de queso crema y manjar blanco. 12 porciones, aprox 21cm de diámetro",
				price: 109.0,
			},
			{
				name: "Red velvet de 12 pzs",
				img: torta3,
				text: "3 discos de keke red velvet, relleno de un mix de frosting de queso crema con chantillí, 2 capas de fudge, frambuesas y blueberries. 12 porciones aprox. 21 cm de diámetro.",
				price: 109.0,
			},
		],
		box_regalos: [
			{
				name: "Love box clásico",
				img: box1,
				text: "12 mini alfajores crocantes full manjar + 14 mini brownie amelcochados con pecanas y fudge + 14 mini crocante de manzana con líneas de chocolate blanco.",
				price: 52.0,
			},
			{
				name: "2 sweet box",
				img: box2,
				text: "21 mini brownies amelcochados con pecanas y fudge + 18 mini alfajores crocantes full manjar",
				price: 52.0,
			},
			{
				name: "Mix ma box petit",
				img: box3,
				text: "4 crocantes de manzana, 4 brownies y 8 alfajores",
				price: 32.0,
			},
		],
	},
};

export default productos;