# Yazur
A YOLOL interpreter with multi-chip support for testing out your planned starbase ideas :D

Can run serverside by requiring as a node module, or es-modules can be imported to run clientside, currently the serverside implementation has a nicer interface, abstracting away from the core lexer, parser & interpreter modules.

### Using the interface modules

In node, simply require the main ``yazur.js`` file, then use it like so:
```js
const Yazur = require('./yazur');

//Network setup
var myYololNetwork = new Yazur.netmgr();

var myYololChip = new Yazur.yChip(
    ["a=10 b=20"],    //An array of strings, one string per line of yolol
    "root",           //the subnet id this chip should listen on
    myYololNetwork    //The network manager to subscribe to
);

var myMemoryChip = var memchip = new Yazur.mChip(
      ["x", "y", "z"],//Array of global field names (without their ":")
      "root",         //the subnet id this chip should listen on
      myYololNetwork  //The network manager to subscribe to
);

//Executing 100 ticks on the network:
for(var i=0; i<100; i++){
  myYololNetwork.queueTick_random();
  //or myYololNetwork.queueTick(); if you want the devices to execute in the order they were added
  myYololNetwork.doTick();
}

```


### Using core modules on their own (Node or ES)
When using the core modules on their own, you'll need a "device" object like this:

```js
var examleDevice={
    localEnv:{
        vars:{},                                              //local variables
        fields:{                                              //This devices fields & their default values
            ":chipwait":{type:3, subtype:1, value:0}
        },
        global:{                                              //discovered global fields from this & other devices
            ":chipwait":{type:3, subtype:1, value:0}
        },   
        nextBroadcast:{},                                     //Globals changed by this chip, to be broadcast to the network
        chipwaitField:":chipwait",                            //Name of the chipwait field for this chip
        nextLine:1                                            //Next yolol line to be executed
    },
    parsed:[]                                                 //Array of parsed yolol lines
};
```
The parsed yolol line array can be populated as shown below, where ``parse`` and ``lex`` are the functions exported by their respective core modules and ``1`` is the line number being parsed (Only used to add line references to lexed tokens, defaults to 0 if not provided)
```js
examleDevice.parsed.push(parse(lex("a=10 b=a //A yolol line as text", 1));
```

A single tick can then be run by passing the chip object to the interpreter like so:
```js
interpret(examleDevice);
```

Inter-device communication is only implemented in the node interface modules, and as such, in es will have to be handled yourself. See the interface modules for reference on how to do this.
