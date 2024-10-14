# ObjectVAULT - readme.md

## Overview

**ObjectVault** is a React-based web application that allows users to track and manage vintage items, providing detailed statistics on their collection, including potential profits and valuations. It includes a simple UI for adding, editing, and selling vintage items, and displays statistics on sold and unsold items, total spending, and profits. 

ObjectVault also integrates a system with **3 agents that work together to retrieve suggested prices for vintage items.** These agents gather information, analyze price ranges, and return the most probable current value for each item.

## Features

- **Add, Edit, Delete Items:** Easily manage a list of vintage items with fields such as name, category, year, purchase price, and current value.
- **Profit Calculation:** Automatically calculate potential profit and profit percentages based on sale price and current value.
- **Statistics Overview:** Display statistics such as total spent, current value, total profit, and the most profitable item.
- **Search and Filter:** Filter and sort items by category, sale status, and various sorting options.
- **Local Storage Support:** Items are saved to local storage and persist between sessions.
- **Price Retrival Agents:** Use 3 agents to gather, analyze, and suggest the most likely price for vintage items.
- **Mobile-Responsive UI:** Ensures optimal viewing on mobile devices.

## Dependencies

- React
- Axios (API Call)
- Framer Motion
- Lucide-React Icons
- Tailwind CSS (Styling)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your username/object-vault.git
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

2. Install the necessary dependencies:
   ```bash
   npm run dev
   ```

## Usage

- **Add New Item:** Click “Add New Item” to open a form and input details for the item. Ensure all fields are filled in, including name, category, year, purchase price, and current value.
- **Edit Item:** Click on the “Edit” button of an existing item to modify its details.
- **Sell Item:** Enter a sale price for an item that has been sold and the application will calculate the profit.
- **Price Suggestion:** Leverage the 3 agents system to retrieve a suggested price for your item, ensuring an accurate and competitive price based on real-world data.
- **Statistics:** View the most profitable item, total items sold, and other statistics by navigating to the statistics card on the main page.

## Development

To contribute to ObjectVault or customize it:

1. Fork the repository and create a new branch for your feature or fix.

2. Submit a pull request with a detailed description of the changes.


## **Happy tracking with ObjectVault!**
   ```bash
   @azuraservices
   ```