import BeersModel from '../models/beers.model.js';

// GET /api/beers/
const getAllBeers = async (req, res) => {
    try {
    const beers = await BeersModel.getAllBeers();
    const PORT = process.env.PORT || 3100;
    const baseUrl = `${req.protocol}://${req.hostname}:${PORT}`;

    const beersWithFullUrl = beers.map(beer => ({
      ...beer,
      image_url: `${baseUrl}${beer.image_url}` // ex: /images/canya.png
    }));

    return res.status(200).json({ beers: beersWithFullUrl });
  } catch (error) {
    console.error('Error al obtenir beers:', error);
    return res.status(500).json({ message: 'Error al obtenir beers' });
  }
};

// GET /api/beers/:id/last-3-days
const getLast3DaysUserBeers = async (req, res) => {
  try {
    const {id} = req.params;
    const {date} = req.query;
    const last3DaysUserBeers = await BeersModel.getLast3DaysUserBeers(id, date);
    
    return res.status(200).json({userBeers: last3DaysUserBeers});
  } catch (error) {
    console.error('Error al obtenir beers:', error);
    return res.status(500).json({ message: 'Error al obtenir beers de l\'usuari' });
  }
};

// POST /api/beers/:id/delete-beer
const deleteUserBeer = async (req, res) => {
  try {
    const {id} = req.params;
    const {beerId} = req.body;
    
    await BeersModel.deleteUserBeer(id, beerId);

    return res.status(200).json({message: 'Beer eliminada correctament'});
  } catch (error) {
    console.error('Error al eliminar la birra:', error);
    return res.status(500).json({ message: 'Error a l\'eliminar la birra de l\'usuari' });
  }
  
  
};


// POST /api/beers/:id/custom
const postCustomUserBeer = async (req, res) => {
  // TODO
};

const addBeerToUser = async (req, res) => {
  try{
    const {id} = req.params;
    const {beerId, date, time, dayOfWeek} = req.body;

    if(!beerId){
      return res.status(400).json({ message: 'Cal proporcionar una beer' });
    }

    const userBeerId = await BeersModel.addBeerToUser(id, beerId, date, time, dayOfWeek);
    return res.status(201).json({message: 'Beer afegida correctament a user', id: userBeerId});

  } catch (error){
    console.error('Error al establir beer a user:', error);
    return res.status(500).json({ message: 'Error al establir beer a user' });
  }
};


export default {
  getAllBeers,
  getLast3DaysUserBeers,
  deleteUserBeer,
  postCustomUserBeer,
  addBeerToUser,
};
