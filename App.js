/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
0
import React, { PureComponent } from 'react';
import { KeyboardAvoidingView ,Keyboard,AppRegistry, TextInput, View, Text, FlatList, ScrollView, Alert, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
// import {Evaluator } from './Parser'
import Button from './Button'

const NUMERIC_CHARSET = '01234567890.',
      ALPHA_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
      OPERATOR_CHARSET = '+-/*^%',
      WHITE_SPACE_REGEX = /\s/;
      const MathFunctions = {
        sin: radians => Math.sin(radians),
        cos: radians => Math.cos(radians),
        tan: radians => Math.tan(radians),
        fact: value => {
            var iter,
                multiplier;
    
            for(multiplier = value - 1; multiplier > 0; --multiplier) {
                value *= multiplier;
            }
    
            return value;
        },
        exp: value => Math.exp(value),
        sqrt: value => Math.sqrt(value),
        ceil: value => Math.ceil(value),
        floor: value => Math.floor(value),
        abs: value => Math.abs(value),
        acos: value => Math.acos(value),
        asin: value => Math.asin(value),
        atan: value => Math.atan(value),
        log: value => Math.log(value),
        round: value => Math.round(value)
    };


const Helpers = {
    isNumeric: char => NUMERIC_CHARSET.indexOf(char) !== -1,
    isAlpha: char => ALPHA_CHARSET.indexOf(char) !== -1,
    isOperator: char => OPERATOR_CHARSET.indexOf(char) !== -1,
    isMathFunction: keyword => typeof MathFunctions[keyword] === 'function',
    isWhitespace: char => WHITE_SPACE_REGEX.test(char),
    radians: angle => angle * Math.PI / 180
};

const OperatorFunctions = {
    '+': (left, right) => left + right,
    '-': (left, right) => left - right,
    '/': (left, right) => left / right,
    '*': (left, right) => left * right,
    '%': (left, right) => left % right,
    '^': (left, right) => Math.pow(left, right)
};

function ExpressionParser() {
    'use strict';

    this.variables = {
        pi: Math.PI,
        PI: Math.PI,
        e: Math.E,
        E: Math.E,
        rand: () => Math.random()
    };

    this.readOnlyVariables = [ ];

    for(var varName in this.variables) {
        this.readOnlyVariables.push(varName);
    }
};

/* Sets a variable */
ExpressionParser.prototype.setVariable = function(name, value) {
    'use strict'; 

    if(this.readOnlyVariables.indexOf(name) !== -1) {
      Alert.alert(
        'Error',
        'Error: Cannot set a variable',
        [
          {text: 'OK'},
        ],
        { cancelable: false }
      ); 
        throw new Error('Error: Cannot set read only variable "' + name + '"');
    }

    this.variables[name] = value;
};

/* Gets a variable */
ExpressionParser.prototype.getVariable = function(name) {
    'use strict';

    if(this.isVariable(name)) {
        var variable = this.variables[name];

        if(typeof variable === 'function') {
            return variable();
        }

        return variable;
    }
};

/* Checks if a variable exists */
ExpressionParser.prototype.isVariable = function(name) {
    'use strict';

    return this.variables.hasOwnProperty(name);
};

/* Parse an expression */
ExpressionParser.prototype.parse = function(expression) {
    'use strict';

    var tokens = this.tokenize(expression);

    tokens = this.parseTokens(tokens);

    var tokensLength = tokens.length,
        iter,
        value = null,
        last_number = null,
        flag_assignment = false;

    for(iter = 0; iter < tokensLength; ++iter) {
        // Get the value
        if(tokens[iter][0] === 'number') {
            value = tokens[iter][1];
        }

        if(tokens[iter][0] === 'assignment') {
            if(
                iter - 1 === 0 &&                   // Check there is a keyword previous
                iter + 1 < tokensLength &&          // Check there is a value to set next

                tokens[iter - 1][0] === 'keyword'
            ) {
                flag_assignment = true;
            } else {
                throw new Error('Error: Unexpected assignment');
            }
        }
    }

    if(flag_assignment) {
        this.setVariable(tokens[0][1], value);
    }

    return value;
};

/* Parse tokens */
ExpressionParser.prototype.parseTokens = function(tokens) {
    'use strict';

    tokens = this.parseVariables(tokens);
    tokens = this.parseBrackets(tokens);
    tokens = this.parseNegatives(tokens);
    tokens = this.parseFunctions(tokens);
    tokens = this.parseOperations(tokens);

    return tokens;
};

ExpressionParser.prototype.parseBrackets = function(tokens) {
    'use strict';

    var tokensLength = tokens.length,
        bracketDepth = 0,
        bracketIndex = 0,
        iter;

    for(iter = 0; iter < tokensLength; ++iter) {
        if(tokens[iter][0] === 'bracket') {
            if(bracketDepth > 0) {
                if(tokens[iter][1] === ')') {
                    --bracketDepth;
                }

                if(bracketDepth === 0) {
                    let leftSide = tokens.slice(0, bracketIndex),
                        parsed = this.parseTokens(tokens.slice(bracketIndex + 1, iter)),
                        rightSide = tokens.slice(iter + 1);

                    tokens = leftSide.concat(parsed, rightSide);
                    iter += tokens.length - tokensLength;
                    tokensLength = tokens.length;
                }
            }

            if(tokens[iter][1] === '(') {
                if(bracketDepth === 0) {
                    bracketIndex = iter;
                }

                ++bracketDepth;
            }
        }
    }

    return tokens;
};

ExpressionParser.prototype.parseNegatives = function(tokens) {
    'use strict';

    var tokensLength = tokens.length,
        iter;

    for(iter = 0; iter < tokensLength; ++iter) {
        // Logic for a negative number
        if(
            tokens[iter][0] === 'operator' &&
            (
                tokens[iter][1] === '-' ||          // Check it's a minus symbol
                tokens[iter][1] === '+'             // Or a plus symbold
            ) &&
            (
                iter - 1 < 0 ||                     // Either there is no previous token...
                tokens[iter - 1][0] !== 'number'    // Or it's not a number
            ) &&
            iter + 1 < tokensLength &&              // Check there is a proceeding token
            tokens[iter + 1][0] === 'number'        // And it's a number
        ) {
            // Make the next number a negative
            tokens[iter + 1][1] = tokens[iter][1] === '-' ? -tokens[iter + 1][1] : tokens[iter + 1][1];
            // Remove this token from stack
            tokens.splice(iter, 1);
            --tokensLength;
            --iter;
            continue;
        }
    }

    return tokens;
};

ExpressionParser.prototype.parseVariables = function(tokens) {
    'use strict';

    var tokensLength = tokens.length,
        iter;

    for(iter = 0; iter < tokensLength; ++iter) {
        if(tokens[iter][0] === 'keyword') {
            if(
                !Helpers.isMathFunction(tokens[iter][1]) && // Check it's not a function
                (
                    iter === tokensLength - 1 ||            // Either this is the last token
                    tokens[iter + 1][0] !== 'assignment'    // Or the next token is not an assignment
                )
            ) {
                // Check variable exists
                if(this.isVariable(tokens[iter][1])) {
                    tokens[iter][0] = 'number';
                    tokens[iter][1] = this.getVariable(tokens[iter][1]);
                    continue;
                } else {
                  Alert.alert(
                    'Error',
                    'Error: Undefined variable',
                    [
                      {text: 'OK'},
                    ],
                    { cancelable: false }
                  ); 
                    throw new Error('Error: Undefined variable "' + tokens[iter][1] + '"');
                }
            }
        }
    }

    return tokens;
};

ExpressionParser.prototype.parseFunctions = function(tokens) {
    'use strict';

    var tokensLength = tokens.length,
        iter;

    for(iter = 0; iter < tokensLength; ++iter) {
        if(tokens[iter][0] === 'keyword' && tokens[iter][1] in MathFunctions) {
            if(
                iter + 1 < tokensLength &&          // Check this is not the last token
                tokens[iter + 1][0] === 'number'    // And the last next token is a number
            ) {
                // Apply math function
                tokens[iter + 1][1] = MathFunctions[tokens[iter][1]](tokens[iter + 1][1]);
                // Remove this token from stack
                tokens.splice(iter, 1);
                --tokensLength;
                --iter;
            } else {

              Alert.alert(
                'Error',
                'Error: Unexpected function',
                [
                  {text: 'OK'},
                ],
                { cancelable: false }
              ); 
                throw new Error('Error: unexpected function "' + tokens[iter][1] + '"');
            }
        }
    }

    return tokens;
};

ExpressionParser.prototype.parseOperations = function(tokens) {
    'use strict';

    // Order of operations 
    var operators = ['^', '*', '/', '+', '-'];

    operators.forEach(operator => {
        tokens = this.parseOperator(tokens, operator);
    });

    return tokens;
};

ExpressionParser.prototype.parseOperator = function(tokens, operator) {
    'use strict';

    var tokensLength = tokens.length,
        iter;

    for(iter = 0; iter < tokensLength; ++iter) {
        var token = tokens[iter],
            token_type = token[0],
            token_value = token[1];

        if(token_type === 'operator' && token_value === operator) {
           
             if( token_value == '/' && tokens[iter + 1][1] === 0  ){
              Alert.alert(
                'Error',
                'Error: Divide by 0',
                [
                  {text: 'OK'},
                ],
                { cancelable: false }
              ); 

             throw new Error('Error: unexpected operator "' + tokens[iter][1] + '"');
          }
          else if( 
                iter - 1 >= 0 &&                        // Check there is a previous token
                iter + 1 < tokensLength &&              // Check there is a next token
                tokens[iter - 1][0] === 'number' &&     // Check the previous token is a number
                tokens[iter + 1][0] === 'number'        // Check the next token is a number
            ) {
                tokens[iter + 1][1] = OperatorFunctions[token_value](tokens[iter - 1][1], tokens[iter + 1][1]);

                let leftSide = tokens.slice(0, iter - 1),
                    rightSide = tokens.slice(iter + 1);

                // Replace sub-expression with the result value
                tokens = leftSide.concat(rightSide);
                iter += tokens.length - tokensLength;
                tokensLength = tokens.length;
             
                continue;
            } else {

              Alert.alert(
                'Error',
                'Error: Unfinished Operator',
                [
                  {text: 'OK'},
                ],
                { cancelable: false }
              );
                throw new Error('Error: unexpected operator "' + tokens[iter][1] + '"');
            }
            
        }
    }

    return tokens;
};

/**
 * Split expression into tokens
 */
ExpressionParser.prototype.tokenize = function(expression) {
    'use strict';

    // Append space so that the last character before that space is tokenised
    expression += ' ';

    // TOKENIZER VARS
    var expressionLength = expression.length,
        iter,
        tokens = [ ],
        buffer = '';

    // FLAGS
    var flag_numeric = false,
        flag_keyword = false,
        flag_operator = false;

    // Iterate through expression
    for(iter = 0; iter < expressionLength; ++iter) {
        var char = expression.charAt(iter),
            char_isNumeric = Helpers.isNumeric(char),
            char_isOperator = Helpers.isOperator(char),
            char_isAlpha = Helpers.isAlpha(char);

        if(flag_keyword) {
            // We've reached the end of the keyword
            if(!char_isAlpha) {
                flag_keyword = false;
                tokens.push(['keyword', buffer]);
                buffer = '';
            }
        }

        if(flag_numeric) {
            // We've reached the end of the number
            if(!char_isNumeric) {
                // Skip char if comma, so we can allow for formatted numbers
                if(char === ',' && iter + 1 < expressionLength && Helpers.isNumeric(expression[iter + 1])) {
                    continue;
                }

                let parsingFunction = parseInt;

                if(buffer.indexOf('.') !== -1) { // Check for float
                    parsingFunction = parseFloat;
                }

                tokens.push(['number', parsingFunction(buffer, 10)]);

                flag_numeric = false;
                buffer = '';
            }
        }

        if(char_isNumeric) {                     // Check for a number
            flag_numeric = true;
            buffer += char;
        } else if(char_isAlpha) {                // Check for a keyword
            flag_keyword = true;
            buffer += char;
        } else if(char_isOperator) {             // Check for an operator
            tokens.push(['operator', char]);
        } else if(char === '(') {                // Check for parentheses
            tokens.push(['bracket', '(']);
        } else if(char === ')') {                // Check for closing parentheses
            tokens.push(['bracket', ')']);
        } else if(char === '=') {                // Check for assignment
            tokens.push(['assignment', char]);
        } else if(!Helpers.isWhitespace(char)) {  // Check for whitespace
          Alert.alert(
            'Error',
            'Error: Unexpected char',
            [
              {text: 'OK'},
            ],
            { cancelable: false }
          );                                         
            throw new Error('Error: Unexpected char "' + char + '"');
        }
    }

    return tokens;
};

var ep = new ExpressionParser();

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { text: '' ,
                   results: [],
                   };
   this.onSubmitEditing = this.onSubmitEditing.bind(this);
  
  }


  onChangeText= (text)=>{
    this.setState({text})
  }

  onSubmitEditing= () => {
  
   try {

     if(this.state.text==='remove'){
      const { results } = this.state;
      if(results.length)
      this.setState({results: results.slice(0, results.length - 1)})
      else 
      Alert.alert(
        'Error',
        'Nothing to remove',
        [
          {text: 'OK'},
        ],
        { cancelable: false }
      );
      this.setState({text: ''} )
     }
     else if(this.state.text=='clear'){
      this.setState({results:[],
                       text: '' })
     }
     else if(this.state.text=='undo')
     {
      const { results } = this.state;
      if(results.length){
      this.setState({text: results.slice(-1)[0].expression, results: results.slice(0, results.length - 1) })
       
      this.setState({text: ''}) ;
      textInputRef.focus() 
    }
      else 
      Alert.alert(
        'Error',
        'Nothing to remove',
        [
          {text: 'OK'},
        ],
        { cancelable: false }
      );
      this.setState({text: ''} )
     }
     else if(this.state.text=='about'){
      Alert.alert(
        'About',
        'My name is Nelli and I am an exchange student',
        [
          {text: 'OK'},
        ],
        { cancelable: false }
      );
      this.setState({text: ''} )
     }
     else if(this.state.text=='help'){
      Alert.alert(
        'Help',
        'Just type any equation you want in the text input. Tap on the result to see the calculation, tap on the result variable to use its value in the calculations',
        [
          {text: 'OK'},
        ],
        { cancelable: false }
      );
      this.setState({text: ''} )
     }   // I HAVE NO IDEA WHY THIS DOES NOT WORK


     else{       
  //     ReplaceR = imput => imput.split(/(?=r)/g).map(chara => (chara.startsWith('r') ? this.getValue(chara) : chara)).join('');
	//     getvalue = (input) => {
	// 	const { results } = this.state;
	// 	let number = '';
  //   let i = 0 ;  
     
	// 	while (/\d/.test(input[i]) && i <= input.length) {
	// 		number += input[i];
	// 		i += 1;
	// 	}
	// 	if (number === '') 
  //      throw new Error('Error: Unexpected assignment');
	// 	const row = Number(number);
	// 	if (row > results.length) {
  //     throw new Error('Error: Unexpected assignment');
	// 	} else {
	// 		return this.state.results[Number(number)].eval + input.slice(i);
	// 	}
  // }
  
  // const newtext = ReplaceR(this.state.text) 
  //     // for(let i = 0; i < this.state.text.length; i++){
        
  //     //   if(this.state.text[i]==='r'){
  //     //     aa=Number(this.state.text[i+1])
  //     //     textCopy=this.state.text.slice()
  //     //     textCopy.replace('r', this.state.results[aa].eval + '')  
  //     //     this.setState({text: textCopy})
  //     //   }
  //     // }
    
  //    console.warn(newtext)
     if(this.state.text && this.state.text!==" "){
     const results = [...this.state.results, { eval: ep.parse(this.state.text), expression: this.state.text} ]
     this.setState({results, text: ''} )
     }
     if(this.state.results.length){
       
        setTimeout(() => {
         this.flatListRef.scrollToEnd();      
       }, 150); }
   } }catch(e) {
    this.setState({text: ''} )

   }
  }
  
    callback = (index) => {                                     //for showing computations    
    // console.warn(this.state.results[index])
    Alert.alert(
      'Computation',
      this.state.results[index].expression + '',
      
      [ 
        {text: 'OK'},
      ],
      { cancelable: false }
    );
  }
                                                                            //for putting the result in the text Input
  callback1 = (index) => {
    aa = this.state.text.concat(this.state.results[index].eval)
    this.setState({text: aa })
    
  }
  render() {
    return (
      <View
      // behavior="padding"
      style={{flex:1, alignItems: 'center'}} >
       <FlatList data={this.state.results}
                 onScroll= {Keyboard.dismiss}
                 ref={(ref) => { this.flatListRef = ref; }}
                 renderItem = {({ item, index }) =>  {
                  return ( 
                    
                    <View style= {{ flex: 1,flexDirection: 'row'}}>  
                    <TouchableOpacity onPress = { () => this.callback1(index)} >     
                    <Text style={{color: '#40e0d0', 
                                  fontSize:35, 
                                  fontFamily: 'italic', 
                                  borderLeftWidth: 2,
                                  borderBottomWidth: 2,
                                  borderTopWidth: 2 ,
                                  borderTopLeftRadius: 10,
                                  borderBottomLeftRadius: 10,
                                  borderColor: '#ffb6c1', 
                                  width: 80,
                                  height: 50
                                  }}>
                       r{index}
                      </Text>  
                      </TouchableOpacity> 
                      <TouchableOpacity onPress = { () => this.callback(index)} >
                      <Text style={{color: item.eval<0 ? 'red' : '#40e0d0', 
                                  fontSize:35, 
                                  fontFamily: 'italic', 
                                  borderLeftWidth: 2,
                                  borderRightWidth:2,
                                  borderBottomWidth: 2,
                                  borderTopWidth: 2 , 
                                  borderTopRightRadius: 10,
                                  borderBottomRightRadius: 10,
                                  borderColor: '#ffb6c1',
                                  width: 200,
                                  height: 50,
                                  textAlign: 'right'
                                  }}>
                             {item.eval}
                      </Text> 
                      </TouchableOpacity>  
                      </View>
                  )}} >
         </FlatList>
        
          <TextInput 
          ref={(ref) => { this.textInputRef = ref; }}
          style={{  borderColor: '#ffb6c1', borderWidth: 3, width: 400, fontSize: 25, fontFamily: 'italic', color: '#40e0d0' }}
          onChangeText={this.onChangeText}
          onSubmitEditing={this.onSubmitEditing}
          value={this.state.text}
          keyboardType={'numeric'}
          placeholder={'Write an expression here'}
           />
        
      </View> 
    );
  }
}



  




