import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/* Global state of the app containing: search object, current recipe object, Shopping list object and Liked recipes */

const state = {};

/* SEARCH CONTROLLER */

const renderError = () => {
    const markup = `
                <div class = "error_container">
                    <img class="cook" src="img/3497816-small.png" alt="drawing of a scared female cook">
                    <h2 class="heading-2">ERROR! COULD NOT FIND RECIPES!</h2>
                </div>
    `;
    elements.searchResList.insertAdjacentHTML('afterbegin', markup);
};

const controlSearch = async () => {
    // 1) Get searched query
    const query = searchView.getInput();

    if (query) {
        // 2) Create new search object and add it to state
        state.search = new Search(query);

        // 3) Prepare user interface for the search results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render the results on user interface
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            searchView.clearResults();
            renderError();
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/* RECIPE CONTROLLER */

const controlRecipe = async () => {
    // Get the recipe ID from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare user interface for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            console.log(err);
            renderError();
        }
    }
};
 
// event listener for multiple events - hashange event and load event
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/* LIST CONTROLLER */

const controlList = () => {
    // Jf there is no list - create one
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and to the user interface
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button click
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete the item from state
        state.list.deleteItem(id);

        // Delete the item from user interface
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/* LIKE CONTROLLER */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to user interface list (add item to the likes list)
        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove the like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from user interfce list (remove item from the likes list)
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// LIKES - LOCAL STORAGE 

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});

//RESPONISE WEB DESIGN SCRIPTS

//SMOOTH SCROLLING TO #RECIPE AND #SHOPPING ON MOBILE SCREENS
if(document.documentElement.clientWidth <= 760) {

    function scrollTo(element, to, duration) {
        if (duration <= 0) return;
        var difference = to - element.scrollTop;
        var perTick = difference / duration * 10;

        setTimeout(function() {
            element.scrollTop = element.scrollTop + perTick;
            if (element.scrollTop === to) return;
            scrollTo(element, to, duration - 10);
        }, 10);
    };

    let rootElement = document.querySelector('.recipe');
    rootElement.addEventListener('click',function(event){
        let selector = '.recipe__btn';
        var targetElement = event.target;
                while (targetElement != null) {
                    if (targetElement.matches(selector)) {
                        const element2 = document.getElementById('shopping');
                        scrollTo(document.documentElement, element2.offsetTop, 600);
                    }
                    targetElement = targetElement.parentElement;
                }
            },
            false
        );

    let rootElement2 = document.querySelector('.results');
    rootElement2.addEventListener('click',function(event){
        let selector = '.results__link';
        var targetElement = event.target;
                while (targetElement != null) {
                    if (targetElement.matches(selector)) {
                          const element2 = document.getElementById('recipe');
                          scrollTo(document.documentElement, element2.offsetTop, 600);
                    }
                    targetElement = targetElement.parentElement;
                }
        },
    false
    );

    let rootElement3 = document.querySelector('.likes');
    rootElement3.addEventListener('click',function(event){
        let selector = '.likes__link';
        var targetElement = event.target;
                while (targetElement != null) {
                    if (targetElement.matches(selector)) {
                          const element2 = document.getElementById('recipe');
                          scrollTo(document.documentElement, element2.offsetTop, 600);
                    }
                    targetElement = targetElement.parentElement;
                }
        },
    false
    );
};

//TOGGLING LIKES MENU ON CLICK FOR TOUCH SCREEN DEVICES (INSTEAD OF SHOWING IT ON :HOVER)

if(document.documentElement.clientWidth <= 1200) {
    document.querySelector('.likes__icon').addEventListener('click', function(e) {
        const likes_panel = document.querySelector('.likes__panel');
        if(likes_panel.style.visibility == 'hidden') {
            likes_panel.style.visibility = 'visible';
            likes_panel.style.opacity = '1';  
        } else {
            likes_panel.style.visibility = 'hidden';
            likes_panel.style.opacity = '0';  
        }
    });
};
