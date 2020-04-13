import axios from 'axios';

export default class Search {
    constructor(query) {
        this.query = query;
    }

    async getResults() {
        try {
            const res = await axios(`https://forkify-api.herokuapp.com/api/search?q=${this.query}`);
            this.result = res.data.recipes;
        } catch (error) {
            const markup = `
                <div class = "error_container">
                    <img class="cook" src="img/3497816-small.png" alt="drawing of a scared female cook">
                    <h2 class="heading-2">ERROR! COULD NOT FIND RECIPES!</h2>
                </div>
            `;
            elements.searchResList.insertAdjacentHTML('afterbegin', markup);
        }
    }
};
