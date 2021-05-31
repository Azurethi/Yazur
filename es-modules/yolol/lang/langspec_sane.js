export default {
    regex:{ //Idea?
        operators: /[\+-\/\*><\^=%!]/,
        fields: /[:_a-zA-Z]/
    },
    keywords: {
        unary: {
            "abs": handlers.math.abs, 
            "sqrt":handlers.math.sqrt, 
            "sin": handlers.math.sin, 
            "cos": handlers.math.cos,
            "tan": handlers.math.tan,
            "asin":handlers.math.asin, 
            "acos":handlers.math.acos, 
            "atan":handlers.math.atan
        },
        binary:{
            "and":handlers.logic.and,
            "or" :handlers.logic.or
        },
        conditional:{
            if:"if",
            then:"then",
            else:"else",
            end:"end"
        },
        jump:{
            goto:"goto"
        }
    },
    
    precedence:{
        "--":1, "++":1,
        "!":3,
        "sin":4, "cos":4, "tan":4, "asin":4, "acos":4, "atan":4, "abs":4, "sqrt":4,
        "^":5,
        "*":6, "/":6, "%":6,
        "+":7, "-":7,
        ">":8,"<":8,">=":8,"<=":8,
        "!=":9,"==":9,
        "or":10,
        "and":11,
        "=":12, "*=":12, "/=":12, "%=":12, "+=":12, "-=":12
    }
}

//TODO fix these (need a way to handle type conversion & deg, not rad)
let handlers = {
    math:{
        abs :(a)=>(Math.abs(a)),
        sqrt:(a)=>(Math.sqrt(a)),
        sin :(a)=>(Math.sin(a)),
        cos :(a)=>(Math.cos(a)),
        tan :(a)=>(Math.tan(a)),
        asin:(a)=>(Math.asin(a)),
        acos:(a)=>(Math.acos(a)),
        atan:(a)=>(Math.atan(a))
    },
    logic:{
        and:(a,b)=>(a),
        or:(a,b)=>(a)
    }
}


