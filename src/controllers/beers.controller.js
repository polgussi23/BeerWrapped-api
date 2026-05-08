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

// GET /api/beers/:id/custom
const getCustomUserBeers = async (req, res) => {
  // TODO
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
  getCustomUserBeers,
  postCustomUserBeer,
  addBeerToUser,
};
