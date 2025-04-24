document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const ingredientInput = document.getElementById('ingredient');
    const recipesContainer = document.getElementById('recipes-container');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const loaderContainer = document.getElementById('loader-container');

    searchBtn.addEventListener('click', async () => {
        const ingredient = ingredientInput.value.trim();
        
        if (!ingredient) {
            alert('Please enter an ingredient');
            return;
        }

        // Get selected style (optional)
        const selectedStyle = document.querySelector('input[name="style"]:checked');
        const style = selectedStyle ? selectedStyle.value : '';

        // Show loading state
        searchBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        loaderContainer.style.display = 'flex';
        searchBtn.querySelector('span').textContent = 'Generating...';

        try {
            const response = await fetch('/get_recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    ingredient,
                    style: style
                }),
            });

            const data = await response.json();

            if (response.ok) {
                displayRecipes(data.recipes);
            } else {
                throw new Error(data.error || 'Failed to generate recipes');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            // Reset loading state
            searchBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            loaderContainer.style.display = 'none';
            searchBtn.querySelector('span').textContent = 'Generate Recipes';
        }
    });

    function displayRecipes(recipesText) {
        recipesContainer.innerHTML = '';
        
        // Split the recipes text into individual recipes
        const recipes = recipesText.split('\n\n')
            .filter(recipe => recipe.trim())
            .slice(0, 10); // Limit to 10 recipes
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card animate-fade-in';
            
            // Parse the recipe text to extract different sections
            const lines = recipe.split('\n');
            let title = '';
            let description = '';
            let ingredients = [];
            let instructions = [];
            let time = '';

            // First line is title
            if (lines.length > 0) {
                title = lines[0].trim().replace('Recipe Name:', '').trim();
            }

            // Second line is description
            if (lines.length > 1) {
                description = lines[1].trim().replace('Description:', '').trim();
            }

            // Find ingredients and instructions
            let currentSection = '';
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                if (line === 'Ingredients:') {
                    currentSection = 'ingredients';
                    continue;
                }
                else if (line === 'Instructions:') {
                    currentSection = 'instructions';
                    continue;
                }
                else if (line.startsWith('Cooking Time:')) {
                    time = line.replace('Cooking Time:', '').trim();
                    continue;
                }
                else if (line.includes('⏱️')) {
                    // Skip if it's the "Time not specified" line
                    if (!line.includes('Time not specified')) {
                        time = line.replace('⏱️', '').trim();
                    }
                    continue;
                }

                // Add ingredients or instructions based on current section
                if (currentSection === 'ingredients' && line) {
                    // Remove numbering if present
                    const ingredient = line.replace(/^\d+\.\s*/, '').trim();
                    if (ingredient && !ingredient.includes('Time not specified')) {
                        ingredients.push(ingredient);
                    }
                }
                else if (currentSection === 'instructions' && line) {
                    // Remove numbering if present
                    const instruction = line.replace(/^\d+\.\s*/, '').trim();
                    if (instruction && !instruction.includes('Time not specified')) {
                        instructions.push(instruction);
                    }
                }
            }

            // Create the recipe card HTML
            recipeCard.innerHTML = `
                <h3 class="recipe-title">${title || 'Untitled Recipe'}</h3>
                <p class="recipe-description">${description || 'No description available'}</p>
                <div class="recipe-ingredients">
                    <strong>Ingredients:</strong>
                    <ul>
                        ${ingredients.length > 0 
                            ? ingredients.map(ing => `<li>${ing}</li>`).join('') 
                            : '<li>No ingredients listed</li>'}
                    </ul>
                </div>
                <div class="recipe-instructions">
                    <strong>Instructions:</strong>
                    <ol>
                        ${instructions.length > 0 
                            ? instructions.map(inst => `<li>${inst}</li>`).join('') 
                            : '<li>No instructions available</li>'}
                    </ol>
                </div>
                ${time ? `<p class="recipe-time">⏱️ ${time}</p>` : ''}
            `;

            recipesContainer.appendChild(recipeCard);
        });
    }

    // Add enter key support
    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}); 