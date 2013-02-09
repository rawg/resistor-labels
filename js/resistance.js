
(function () {
  
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
      return Colors.names.indexOf(color);
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
      "#FFFFFF"
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
      "white"   // 9
    ]
    
  };
  
  var Label = {
    size: 300,
    margin: 12,
    ohms: "\u03A9", //"Ω",
    bandHeight: 0,
    
    create: function (resistance) {
      var group = new fabric.Group(),
        bandWidth = (Label.size - Label.margin * 2) / resistance.bands.length;
      
      
      group.add(new fabric.Rect({
        "width": Label.size, 
        "height": Label.size, 
        "top": 0, 
        "left": 0, 
        "strokeWidth": 1, 
        "stroke": "#333", 
        "fill": "rgba(255,255,255,0)"
      }));
      
      for (var i = 0; i < resistance.bands.length; i++) {
        group.add(new fabric.Rect({
          "width": bandWidth - Label.margin,
          "height": Label.bandHeight,
          "top": Label.bandHeight / 2 - (Label.size - Label.bandHeight),
          "left": i * bandWidth + (bandWidth / 2) - (Label.size / 2) + Label.margin,
          "rx": 4,
          "ry": 4,
          "fill": Colors.getByName(resistance.bands[i]),
          "stroke": "#666",
          "strokeWidth": 1,
          "selectable": false
        }));
      }
      
      var label = new fabric.Text(resistance.label, {
        "fontFamily": "FreeBeer",
        "fontWeight": 700,
        "fontSize": 32,
        "fill": "#333333",
        "selectable": false,
        "useNative": false
      });
      
      Canvas.ghost.add(label).renderAll();
      label.top = ((Label.size / 2) - Label.margin - (label.height / 2)) * -1;
      label.left = 0;
      group.add(label);
      
      return group;
    }
  };
  Label.bandHeight = Label.size * .8 - Label.margin * 2;
  
  var Canvas = {
    fabric: null,
    ghost: null,
    jq: null,
    row: 0,
    col: 0,
    maxColumns: 8,
    
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
      
      if (Canvas.col == Canvas.maxColumns) {
        Canvas.col = 0;
        ++Canvas.row;
      } else {
        ++Canvas.col;
      }
      
    }
  };
  
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
    this.ohms *= Math.pow(10, Colors.getValueByName(arguments[arguments.length - 1]));
    
    // Ohms to label (such as 562KΩ)
    if (this.ohms / 1000000 > 1) {
      this.label = this.ohms / 1000000 + " M" + Label.ohms;
    } else if (this.ohms / 1000 > 1) {
      this.label = this.ohms / 1000 + " K" + Label.ohms;
    } else {
      this.label = this.ohms + " " + Label.ohms;
    }
    
  }
  
  
  $(function () {
    Canvas.fabric = new fabric.Canvas("Labels", {"selection": false});
    Canvas.ghost = new fabric.Canvas("Ghost");
    Canvas.jq = $("#Labels");
    
    
    var $ref = $("#ColorRef ul"),
      $err = $("#ErrorChecking"),
      $errStatus = $("#Status");
      
    for (var i in Colors.names) {
      $ref.append(
        '<li style="background-color: ' + Colors.getByName(Colors.names[i])
        + '; color: ' + Colors.getLabelColorByName(Colors.names[i]) + '">'
        + i + ": " + Colors.names[i] + "</li>"
      );
    }
    
    $("#Generate").click(function () {
      $err.html("");
      Canvas.fabric.clear().renderAll();
      
      var isValid = true,
        entries = $("#Input").val()
          .replace(/\r/g, "\n")       // Remove any line breaks from less privileged platforms
          .replace(/[\n]{2,}/g, "\n") // Reduce successive line breaks
          .replace(/[\s]{2,}/g, " ")  // Reduce successive white space 
          .replace(/(^[\s]+|[\s]+$)/, "") // Remove leading or trailing white space
          .split(/[\n]+/g);
      
      // Error checking
      for (var i in entries) {
        var out = "<p>";
        entries[i] = entries[i].split(/[\s]+/);
        
        for (var n in entries[i]) {
          if (n < 4 && Colors.isColor(entries[i][n])) {
            out += entries[i][n] + " ";
          } else {
            isValid = false;
            out += '<span class="err">' + entries[i][n] + "</span>";
          }
        }
        
        out += "</p>";
        $err.append(out);
        
      }
      
      // Rendering
      if (isValid) {
        $errStatus.html("OK");
        for (var i in entries) {
          try {
            Canvas.addLabel(Label.create(new Resistance(entries[i])));
          } catch (e) {
            console.log(e);
          }  
        }
      } else {
        $errStatus.html("Error!");
      }
      
    });
    
    $("#Save").click(function () {
      window.open(Canvas.fabric.toDataURL('png'));
    });
    
  });
  
})();