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
        let packSet = $(elem).find('div.prints-current-details span:first-of-type').text();
        packSet = packSet.substring(0, packSet.indexOf("(")).trim();
        let rarity = $(elem).find('div.prints-current-details span:nth-of-type(2)').text().split('◊').length - 1;
        // TODO: Should rewrite at some point when allowed tradeable rarities change
        rarity = (rarity === 0) ? 5 : rarity;

        const id = `${cardName} ${packSet} ${rarity}`;

		results.push({ id, cardName, packSet, rarity, imgSrc });
	});

    return results;
};

async function updateCards(scrapedResults) {
    const cards = card(db.sequelize, db.Sequelize.DataTypes);

    // Delete all entries in table first, start clean
    // cards.sync({ force: true });
    
    for (const result of scrapedResults) {
        const existingCard = await cards.findOne({
            where: {
                id: result.id,
                name: result.cardName,
                packSet: result.packSet,
                rarity: result.rarity
            }
        });

        if (!existingCard) {
            await cards.create({
                id: result.id,
                name: result.cardName,
                image: result.imgSrc,
                packSet: result.packSet,
                rarity: result.rarity
            });
            console.log(`[LOG] Added new card: ${result.cardName} from ${result.packSet}, rarity ${result.rarity}`);
        } else {
            console.log(`[LOG] Card already exists in database: ${result.cardName} from ${result.packSet}, rarity ${result.rarity}`);
        }
    }
};

// URL is a query for all currently tradeable cards in Pocket TCG - first four sets; 1 diamond through 1 star rarity
scrapeSite(
    'https://pocket.limitlesstcg.com/cards/?q=!set%3AA3%2CA3b%2CA3a%2CA1%2CA1a%2CA4a%2CA2b%2CA2%2CA2a%2CA4+rarity%3A1%2C2%2C3%2C4%2C5+display%3Afull+sort%3Aname&show=all&page=2')
    .then(result => {
        console.log(`[LOG] Successfully scraped ${result.length} tradeable cards.`);
        updateCards(result);
	}).catch(err => console.log(err));