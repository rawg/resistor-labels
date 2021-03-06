
(function () {
  
  /**
   * Colors and values
   */
  var Colors = {
    isColor: function (color) {
      return Colors.names.indexOf(color) != -1;
    },
    
    getByName: function (color) {
      return Colors.colors[Colors.names.indexOf(color)];
    },
    
    getLabelColorByName: function (color) {
      return Colors.labelColors[Colors.names.indexOf(color)];
    },
    
    getValueByName: function (color) {
      var value = Colors.names.indexOf(color);
      if (value > 9) {
        throw "Trying to get value of gold or silver";
      }
      return value;
    },
    
    getMultiplierByName: function (color) {
      return Colors.multipliers[Colors.names.indexOf(color)];
    },
    
    labelColors: [
      "#cccccc",
      "#cccccc",
      "#333333",
      "#333333",
      "#333333",
      "#333333",
      "#cccccc",
      "#333333",
      "#ffffff",
      "#333333",
      "#333333",
      "#333333"
    ],
    
    colors: [
      "#000000",
      "#5E3223",
      "#E60B0B",
      "#F76B20",
      "#F7F73E",
      "#0BE60B",
      "#0B0BE6",
      "#E515E5",
      "#999999",
      "#FFFFFF",
      "#E7AA0B",
      "#CCCCCC"
    ],
    
    names: [
      "black",  // 0
      "brown",  // 1
      "red",    // 2
      "orange", // 3
      "yellow", // 4
      "green",  // 5
      "blue",   // 6
      "violet", // 7
      "grey",   // 8
      "white",   // 9
      "gold",
      "silver"
    ],
    
    multipliers: [
      1,          // black
      10,         // brown
      100,        // red
      1000,       // orange
      10000,      // yellow
      100000,     // green
      1000000,    // blue
      10000000,   // violet
      0,          // grey
      0,          // white
      0.1,        // gold
      0.01        // silver
    ]
  };
  
  /**
   * Labeling properties and functions
   */
  var Label = {
    size: 300,
    margin: 20,
    spacing: 10,
	dpi: 72,
    useDecimals: true,
    showBorders: true,
    ohms: "\u03A9", // Ω, preferred over \u2126,
    bandHeight: 0,
    
    /**
     * Create a label as a Fabric group from a given resistance
     */
    create: function (resistance) {
      var group = new fabric.Group(),
        margin = Math.round(Label.size * 0.06),
        spacing = Math.round(margin * 0.5),
        bandHeight = Label.size * .8 - margin * 2,
        bandWidth = (Label.size - margin * 2) / resistance.bands.length;
      
      
      
      // Border/background
      group.add(new fabric.Rect({
        "width": Label.size, 
        "height": Label.size, 
        "top": 0, 
        "left": 0, 
        "strokeWidth": Label.showBorders ? 0.5 : 0, 
        "stroke": Label.showBorders ? "#999999" : "#ffffff", 
        "fill": "#fff"
      }));
    
      // Colored bands
      for (var i = 0; i < resistance.bands.length; i++) {
        group.add(new fabric.Rect({
          "width": bandWidth - spacing,
          "height": bandHeight,
          "top": (Label.size / 2 * -1) + margin + (Label.size - bandHeight - margin * 2) + (bandHeight / 2),
          //bandHeight / 2 - (Label.size - bandHeight - margin),
          "left": (Label.size / 2 * -1) + (bandWidth * i) + margin + bandWidth / 2,
          "rx": 6,
          "ry": 6,
          "fill": Colors.getByName(resistance.bands[i]),
          "stroke": "#666",
          "strokeWidth": 1,
          "selectable": false
        }));
      }
      
      // Label
      var label = new fabric.Text(resistance.label, {
        "fontFamily": "FreeBeer",
        "fontWeight": 700,
        "fontSize": parseInt(Label.size / 10),
        "fill": "#333333",
        "selectable": false,
        "useNative": false
      });
      
      Canvas.ghost.add(label).renderAll();
      label.top = ((Label.size / 2) - margin - (label.height / 2)) * -1;
      label.left = 0;
      group.add(label);
      
      return group;
    }
  };
  
  /**
   * Canvas properties
   */
  var Canvas = {
    fabric: null, // Fabric instance
    ghost: null,  // "Ghost" canvas for calculating text width and height
    jq: null,     // jQuery handle for canvas
    row: 0,       // Current row
    col: 0,       // Current column
    maxColumns: function () {  // Maximum number of columns before wrapping
		return Math.floor(8 / (Label.size / Label.dpi)); 
	},
	    
    /**
     * Add a label to the canvas
     */
    addLabel: function (label) {
      // Increase width while adding to first row
      if (Canvas.row == 0) {
        var width = Label.size * (Canvas.col + 1);
        Canvas.jq.width(width);
        Canvas.fabric.setWidth(width);
      }
      
      // Increase height
      var height = Label.size * (Canvas.row + 1);
      Canvas.jq.height(height);
      Canvas.fabric.setHeight(height);
      
      Canvas.fabric.calcOffset();
      
      label.top = Canvas.row * Label.size + (Label.size / 2);
      label.left = Canvas.col * Label.size + (Label.size / 2);
      
      Canvas.fabric.add(label);
      Canvas.fabric.renderAll();
      
      if (Canvas.col == Canvas.maxColumns() - 1) {
        Canvas.col = 0;
        ++Canvas.row;
      } else {
        ++Canvas.col;
      }
      
    }
  };
  
  // Multiples for friendly labeling
  var multiples = [
    {"base": 1000000, "label": "M"},
    {"base": 1000, "label": "K"},
    {"base": 1, "label": ""},
    //{"base": 0.001, "label": "m"}
  ];
  
  
  /**
   * Representation of a resistance with bands, Ohms, and human-friendly labeling
   */
  function Resistance() {
    // Argument validation
    if (arguments.length < 3) {
      if (typeof arguments[0] == "object" && arguments[0].length >= 3) {
        arguments = arguments[0];
      } else {
        throw "Missing arguments; expecting 3-4 bands";
      }
    }
    
    // Initialize
    this.ohms = 0;
    this.label = "";
    this.bands = Array.prototype.slice.call(arguments);
    
    // Bands to Ohms
    for (var i = 0, multiplier = Math.pow(10, arguments.length - 2); i < arguments.length - 1; i++, multiplier /= 10) {
      this.ohms += multiplier * Colors.getValueByName(arguments[i]);
    }
    this.ohms *= Colors.getMultiplierByName(arguments[arguments.length - 1]);
    
    // Arrive at a human friendly label (5.6KOhms vs 5600Ohms)
    for (var i in multiples) {
      if (this.ohms / multiples[i].base >= 1) {
        if (Label.useDecimals) {
          // Use decimal notation
          this.label = this.ohms / multiples[i].base + multiples[i].label + Label.ohms;
          
        } else {
          // Put remainder to right of Ohms symbol, e.g. 5R6
          this.label = parseInt(this.ohms / multiples[i].base) + multiples[i].label + Label.ohms;
          var r = this.ohms % multiples[i].base;
          if (r > 0) {
            this.label += Math.round(r / (multiples[i].base / 10));
          }
          
        }
        
        break;
      }
    }
    
    /**
     * Comparison function to test for object equality
     */
    this.equals = function (resistance) {
      if (typeof resistance !== "object" || typeof resistance.bands !== "object") {
        return false;
      }
      
      var isEqual = true;
      for (var i in this.bands) {
        if (this.bands[i] != resistance.bands[i]) {
          isEqual = false;
          break;
        }
      }
      return isEqual;
    }
  }
  
  /**
   * Comparison function for sorting resistors
   */
  Resistance.compare = function (a, b) {
    return a.ohms - b.ohms;
  }
  
  
  $(function () {
    Canvas.fabric = new fabric.Canvas("Labels", {"selection": false});
    Canvas.ghost = new fabric.Canvas("Ghost");
    Canvas.jq = $("#Labels");
     
    
    var $ref = $("#ColorRef ul"),
      $err = $("#ErrorChecking"),
      $showBorders = $("#ShowBorder"),
      $decimals = $("#UseDecimal"),
      $labelSize = $("#LabelSize"),
	  $labelDpi = $("#LabelDpi"),
      $labelSizeIn = $("#LabelSizeInches");
      
    // Add color names to modal
    for (var i in Colors.names) {
      $ref.append(
        '<li style="background-color: ' + Colors.getByName(Colors.names[i])
        + '; color: ' + Colors.getLabelColorByName(Colors.names[i]) + '">'
        + i + ": " + Colors.names[i] + "</li>"
      );
    }
   
    function setLabelIn(inches) {
		Label.size = parseInt(inches * Label.dpi);	
		$labelSize.val(Label.size);
	}

	function setLabelPx(pixels) {
		Label.size = pixels;
		$labelSizeIn.val((Label.size / Label.dpi).toFixed(1));
	}

    // Update label size
	$labelDpi.val(Label.dpi);
    $labelSize.val(Label.size);
    $labelSizeIn.val((Label.size / Label.dpi).toFixed(1));
    
    /* * * * Event handling * * * */
    
    // Use decimals?
    $decimals.click(function () {
      Label.useDecimals = $decimals.is(":checked");
    });
    
    // Show borders?
    $showBorders.click(function () {
      Label.showBorders = $showBorders.is(":checked");
    });
    
    // Change label size
    $labelSize.change(function () {
      setLabelPx(parseInt($labelSize.val()));
      return false;
    });
    
    $labelSizeIn.change(function () {
      setLabelIn(parseFloat($labelSizeIn.val()));
      return false;
    });

	$labelDpi.change(function () {
		Label.dpi = parseInt($labelDpi.val());
    	setLabelIn($labelSizeIn.val());
	});

    $("#Generate").click(function () {
      $err.html("");
      $("#Save").attr("disabled", false);
      Canvas.row = 0;
      Canvas.col = 0;
      Canvas.fabric.clear().renderAll();
      
      var isValid = true,
        resistances = [],
        entries = $("#Input").val()
          .toLowerCase()              // Convert to lower case
          .replace(/[^a-z\s]/g, " ")  // Remove commas and other undesirables
          .replace(/\r/g, "\n")       // Remove any line breaks from less privileged platforms
          .replace(/[\n]{2,}/g, "\n") // Reduce successive line breaks
          .replace(/[\s]{2,}/g, " ")  // Reduce successive white space 
          .replace(/(^[\s]+|[\s]+$)/, "") // Remove leading or trailing white space
          .split(/[\n]+/g);
      
      // Error checking
      for (var i in entries) {
        var out = "",
          isValidRow = true;
          
        entries[i] = entries[i].split(/[\s]+/);
        
        for (var n in entries[i]) {
          if (n < 4 && Colors.isColor(entries[i][n])) {
            out += entries[i][n] + " ";
          } else {
            isValid = false;
            isValidRow = false;
            out += '<span class="feedback-error">' + entries[i][n] + "</span> ";
          }
        }
        
        try {
          resistances[i] = new Resistance(entries[i]);
          if (isValidRow) {
            out += "(" + resistances[i].label + ")";
          }
          
        } catch (e) {
          // do nothing; we have other error handling
          continue;
        }
        
        if (isValidRow) {
          out = '<i class="icon-ok"></i> ' + out;
        } else {
          out = '<i class="icon-remove"></i> ' + out;
        }
        
        $err.append("<li>" + out + "</li>");
        
      }
      
      resistances.sort(Resistance.compare);
      
      // Rendering
      if (isValid) {
        var last = null;
        
        for (var i in resistances) {
          // Dedupe and add to canvas
          if (last == null || !resistances[i].equals(last)) {
            Canvas.addLabel(Label.create(resistances[i]));
            last = resistances[i];
          }
        }
      }
      
    });
    
    $("#Save").click(function () {
      window.open(Canvas.fabric.toDataURL('png'));
    });
    
  });
  
})();
