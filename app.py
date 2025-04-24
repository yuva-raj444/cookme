from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel("models/gemini-2.0-flash-lite")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_recipes', methods=['POST'])
def get_recipes():
    try:
        data = request.json
        ingredient = data.get('ingredient')
        style = data.get('style', '')
        
        if not ingredient:
            return jsonify({'error': 'Please provide an ingredient'}), 400

        # Only include style in prompt if it's provided
        style_text = f" {style}" if style else ""
        prompt = f"""Generate 10 {ingredient} recipes{style_text}. Each recipe MUST follow this EXACT format with NO variations:

Recipe Name: [name]
Description: [description]
Ingredients:
[list all ingredients, one per line]
Instructions:
[list all steps, one per line]
Cooking Time: [time]

IMPORTANT RULES:
- Each recipe must start with "Recipe Name:"
- Each recipe must have "Description:"
- List all ingredients under "Ingredients:" header, one per line
- List all steps under "Instructions:" header, one per line
- Each recipe must end with "Cooking Time:"
- No variations in format allowed
- No extra text or explanations
- No emojis or symbols except in cooking time
- List ALL ingredients and steps needed
- Be specific with measurements and cooking times
- Make the recipes practical and easy to follow

[Generate 10 recipes following these rules exactly]"""

        response = model.generate_content(prompt)
        recipes = response.text

        # Validate the format
        if not all(keyword in recipes for keyword in ['Recipe Name:', 'Description:', 'Ingredients:', 'Instructions:', 'Cooking Time:']):
            return jsonify({'error': 'Invalid recipe format received from the model'}), 500

        return jsonify({'recipes': recipes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 