//Dependencies
var mysql = require("mysql"); //MySQL
var inquirer = require("inquirer"); //Inquirer
var Table = require('cli-table'); //For Table formatting
var chalk = require('chalk'); //For font color and properties

//Create the connection for the sql database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "", //password
  database: "bamazon"
});

//Connect to the mysql server and sql database
connection.connect(function(err) {
    if (err) throw err;
    welcome();
});

//Function that presents welcome statement the first time 
function welcome(){
    console.log(chalk.yellow.bold("\n\t===========** WELCOME TO BAMAZON **==========="));
    showProducts()
}

//Function to show list of products available for purchase
function showProducts(){
    connection.query("SELECT item_id, product_name, price FROM products", function(err, res){
        if (err) throw err;
        //Table formatting using Cli-table package
        var table = new Table({
            head: ['ITEM ID', 'PRODUCT NAME', 'PRICE'],
            style: {
                head: ['yellow'],
                compact: true,
                colAligns: ['center'],
                "padding-left": 2,
                "padding-right": 2
            }
        });
        console.log(chalk.bold("\n\tBelow is a list of items you can purchase from our store"));
        console.log("\t~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
        for(var i=0; i <res.length; i++){
            table.push ([res[i].item_id, res[i].product_name, "$" + res[i].price]);
        }
        console.log (table.toString());
        console.log ("");
        buyProducts();
    })
}

//Function to ask user what product and quantity they want to purchase
function buyProducts(){
    inquirer.prompt([
        {
            name:"chosenItem",
            type: "input",
            message: chalk.green("Please enter the Item ID of the product you would like to purchase?"), 
            validate: function(value){
                if (value!=="" && isNaN(value) == false &&  value<11 ) {
                    return true;
                } else {
                    return chalk.bgRed("**ERROR** Invalid ID, enter a valid ID from the list");
                }
            }
        },
        {
            name: "chosenQty",
            type: "input",
            message: chalk.green("How much quantity would you like to purchase?"), 
            validate: function(value){
                if (value!=="" && isNaN(value) == false) {
                    return true;
                } else {
                    return chalk.bgRed("**ERROR** Enter a number");
                }
            }
        }
    ])
    .then(function(answer){
        var query = "SELECT item_id,product_name, stock_quantity, price FROM products WHERE item_id = ?";
        connection.query(query, [answer.chosenItem], function(err, res){
            for (var i = 0; i <res.length; i++) {
                console.log(chalk.yellow("\nYour product choice is: ") + chalk.white.bold(res[i].product_name) + " " + chalk.yellow("for a quantity of") + " " + chalk.white.bold(answer.chosenQty));
                console.log(chalk.yellow("\nWe currently have a quantity of ") + chalk.white.bold(res[i].stock_quantity) + " " + chalk.yellow("for this product"));
                if(res[i].stock_quantity <answer.chosenQty){
                    console.log (chalk.bgRed("\nSorry there is not enough quantity of this product in stock.\n"));
                    nextOption();
                }
                else {
                    console.log(chalk.inverse("\n\t*****************************************************"));
                    console.log(chalk.inverse("\tYour order has been processed.Thank you for Shopping!"));
                    console.log(chalk.inverse("\t*****************************************************"));
                    console.log (chalk.inverse.bold("\tYou purchased" + " " + chalk.underline(res[i].product_name) + " " + "with quantity of" + " " + chalk.underline(answer.chosenQty) + ".            "));
                    var purchaseTotal = res[i].price * answer.chosenQty;
                    console.log(chalk.inverse.bold("\tYour total COST is $" + purchaseTotal + "                             "));
                    console.log(chalk.inverse.bold("\t*****************************************************"));
                    var newQty = res[i].stock_quantity - answer.chosenQty;
                    console.log (chalk.green("\nWe now have a quantity of " + newQty + "  remaining for this product\n"));
                    //Updating stock quantity in the database
                    connection.query("UPDATE products SET stock_quantity = " + newQty +" WHERE item_id = " + res[i].item_id, function(err, res){
                    nextOption();
                    });
                }
            }
        })
    })
}

//Function for prompts to buy more or quit
function nextOption(){
    inquirer.prompt([
        {
            name: "continue",
            type: "confirm",
            message: chalk.green("Do you want to puchase another product?")
        }
    ])
    .then(function(response){
        if (response.continue == true){
            console.log("you want to continue shopping");
            showProducts();
        }
        else{
            console.log ("\n\tThank you for visiting!");
            console.log ("\n\t\tGOOD BYE!");
            connection.end();
        }
    })
}

