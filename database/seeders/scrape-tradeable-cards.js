import axios from 'axios';
import cheerio from 'cheerio';
import db from '../models/index.js';
import card from '../models/card.js';

async function scrapeSite(url) {
	const { data } = await axios.get(url);
	const $ = cheerio.load(data);
	const results = [];
	$('div.card-page-main').each((i, elem) => {
		const imgSrc = $(elem).find('img.card').attr('src');
		const cardName = $(elem).find('span.card-text-name').text();
        let set = $(elem).find('div.prints-current-details span:first-of-type').text();
        set = set.substring(0, set.indexOf("(")).trim();
        let rarity = $(elem).find('div.prints-current-details span:nth-of-type(2)').text().split('◊').length - 1;
        // TODO: Should rewrite at some point when allowed tradeable rarities change
        rarity = (rarity === 0) ? 5 : rarity;

        const id = `${cardName} ${set} ${rarity}`;

		results.push({ id, cardName, set, rarity, imgSrc });
	});

    return results;
};

async function updateCards(scrapedResults) {
    const cards = card(db.sequelize, db.Sequelize.DataTypes);

    // Delete all entries in table first, start clean
    cards.destroy({
        where: {},
        truncate: true,
      });
    
    for (const result of scrapedResults) {
        const existingCard = await cards.findOne({
            where: {
                id: result.id,
                name: result.cardName,
                set: result.set,
                rarity: result.rarity
            }
        });

        if (!existingCard) {
            await cards.create({
                id: result.id,
                name: result.cardName,
                image: result.imgSrc,
                set: result.set,
                rarity: result.rarity
            });
            console.log(`[LOG] Added new card: ${result.cardName} from ${result.set}, rarity ${result.rarity})`);
        } else {
            console.log(`[LOG] Card already exists in database: ${result.cardName} from ${result.set}, rarity ${result.rarity})`);
        }
    }
};

// URL is a query for all currently tradeable cards in Pocket TCG - first four sets; 1 diamond through 1 star rarity
scrapeSite(
    'https://pocket.limitlesstcg.com/cards/?q=%21set%3AA1%2CA1a%2CA2%2CA2a+rarity%3A1%2C2%2C3%2C4%2C5+display%3Afull+sort%3Aset&show=all')
    .then(result => {
        console.log(`[LOG] Successfully scraped ${result.length} tradeable cards.`);
        updateCards(result);
	}).catch(err => console.log(err));