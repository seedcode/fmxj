//fmxj.js a Javascript Object Based approach to FileMaker Custom Web Publishing

 /*
 
LICENSE
 
(The MIT License)

Copyright (c) 2015 SeedCode SeedCode.Com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


var fmxj = ( function () {
'use strict'
return {
	
	postQueryFMS: postQueryFMS ,
	convertXml2js: convertXml2Js,
	findRecordsURL: findRecordsURL,
	editRecordURL: editRecordURL,
	deleteRecordURL: deleteRecordURL,
	filterObjects: filterObjects,
	sortObjects: sortObjects
}

//**********FileMaker Server Functions


//function does an httpXMLRequest to the server and returns the results in JSON
//Optional PHP Proxy/Relay information can be passed via the phpRelay object.
//user and pass are provided if you're running your own client side auth routine. (Sent via POST).
//var phpRelay = {"php":"fmxj.php","server":"192.168.1.123","protocol":"http","port":80,"user":"Admin","pass":"1234"};
function postQueryFMS( query , callBackOnReady , callBackOnDownload , phpRelay ) {
		
	//check if we're a delete request as we handle error captryre differently, i.e. return ERRORCODE:0.
	var li = query.lastIndexOf("-");
	var parm = query.substring(li,query.length);
	if (parm==="-delete"){var del=true};
	
	//if a proxy object is specified, then we'll send our POST to fmxjRelay.PHP page, so update query value.  
	//Otherwise we're posting locally right to FMS via XML.
	if(phpRelay){
		
		//default to http if not specified
		if (phpRelay["protocol"])
			{var proxy = phpRelay["protocol"]} 
		else {var proxy = "http"};
		
		//define FMS server location if specified
		var server = "";
		if (phpRelay["server"])
			{server = proxy + "://" + phpRelay["server"]}
		else {server = ""};
		
		//append port if specified
		if (phpRelay["port"] && server!==""){
			server += ":" + phpRelay["port"] + "/";
			}
		else if (server==="") {
			server = "/";
		}
		else {
			server += "/";
		}
		;
		
		var php = phpRelay["php"];
		
		// if you're running your own authentication routine you can send via POST and the PHP page will use to auth to FMS.
		var user = phpRelay["user"];
		var pass = phpRelay["pass"];
		
		//define target and POST payload
		var url = server + php  ;
		var creds = "&u=" + user + "&p=" + pass;
		var lengthParamStr = "&l=";
		var cl = creds.length;
		var cl = cl.toString().length + lengthParamStr.length + cl;
		query += creds + lengthParamStr + cl;
		
	}
	//going right to FMS via XML locally.
	else{
		url = "/fmi/xml/FMPXMLRESULT.xml";
	};
	
	//define request.
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
	    var js = convertXml2Js(xmlhttp.responseXML,del);
		xmlhttp = null;
		if ( callBackOnReady ) { callBackOnReady ( js ) } else { return js } ;
	}
	};
	if(callBackOnDownload){
		xmlhttp.onprogress = function(e){
			//e.loaded is the only feedback we get from FMS, but still may be useful.
			callBackOnDownload(e.loaded);
		}
	};
	xmlhttp.open( "POST",  url , true ) ;
	xmlhttp.send(query);
	
};

//parses a FMPXMLRESULT into JSON adding -recid and -modid properties.
//FMPXMLRESULT is 50-60% the size of fmresultset, so that's what we're using.
//function for converting xml onready in queryFMS but could have uses outside of there.
function convertXml2Js( xml , isDeleteRequest ){

		var newObject = function (xmlRow , props , recid , modid) {
			
		
			var dataTag = "DATA";
			var colTag = "COL";
			var thisProp = "";
			var column = "";
			var data = "";
			var val = "";
			var thisPropObj = "";
			var thisObj = "";
			var p = 0;
			var children = 0;
			var i = 0;
			var colCount = 0;
			var propArray = [];
			var thisRecord = {};
			
			//simple factory for related records.
			var newRelatedObject = function(){
				var o = {};
				return o;
			};
			
			
			thisRecord["-recid"]=recid;
			thisRecord["-modid"]=modid;
			
			colCount = xmlRow.childNodes.length;
			
			while(i<colCount){
				var c = 0;
				thisPropObj = props[i];
				thisProp = thisPropObj["property"];
				thisObj = thisPropObj["object"];
				column = xmlRow.getElementsByTagName(colTag)[i];
				if(thisObj){
				//related column
				//does this property exist already
					thisObj= "-" + thisObj ;
					children = column.childNodes.length;
					if(!thisRecord[thisObj]&&children){
						thisRecord[thisObj]=[];
					}
					else if(children==0){
						thisRecord[thisObj]="";
					}
					while(c<children){
						data = column.getElementsByTagName(dataTag)[c].childNodes[0];
						if (data) { val = data.nodeValue } else {val = ""};
						//does this object exist already
						if(!thisRecord[thisObj][c]){
							thisRecord[thisObj][c] = newRelatedObject();
						};
						thisRecord[thisObj][c][thisProp]=val;	
						c++
					};
									
				}
				else{
				//local column
					data = column.getElementsByTagName(dataTag)[0].childNodes[0];
					if (data) { val = data.nodeValue } else {val = ""};
					thisRecord[thisProp]=val;
				}
			i++;
			}
			return(thisRecord);
		};
				
		//object for defining layout, i.e. related fields will be put into sub-array.
		var layoutModel = function ( FMXMLMetaData ){
			
			//factory for object describing the field.
			var newFieldObject = function(prop,obj){
				var o = {};
				o["property"]=prop;
				o["object"]=obj;
				return o;
			};
			
			var nameTag = "NAME"
			var fieldCount = FMXMLMetaData.childNodes.length ;
			var result = [];
			var i = 0 ;
			var field = ""
			while ( i < fieldCount ){
				field = FMXMLMetaData.childNodes[i].getAttribute(nameTag);

				//related field
				if(field.indexOf("::")>0){
					var p = field.indexOf("::");
					var t = field.substring(0,p);
					var f = field.substring(p+2);
					var fieldObject = newFieldObject(f,t);
				}
				//local field
				else
				{
					var fieldObject = newFieldObject(field,null);
				}
				result.push(fieldObject);
				i++;
			}
			return result ;
		};
		

		var resultTag = "RESULTSET" ;
		var errorCodeTag = "ERRORCODE" ;
		var metadataTag = "METADATA" ;
		var recordTag = "ROW" ;
		var foundTag = "FOUND";
		var recid = "RECORDID";
		var modid = "MODID";
		var id = "";
		var mid = "";

		var result = [];
		var row = {};
		var c = 0 ;
		
		//error check return error code object if not 0 OR delete request.
		var error = xml.getElementsByTagName(errorCodeTag)[0].childNodes[0].nodeValue;
		if ( error!=0 | isDeleteRequest ) {
			// exit with errcode object
			var errorObject = {};
			var errorJs = [];
			errorObject[errorCodeTag] = error ;
			errorJs[0] = errorObject ;
			return errorJs;
		}
		
		var mData = xml.getElementsByTagName(metadataTag)[0];
		var fieldObjects = layoutModel(mData);
		var numResults = xml.getElementsByTagName(resultTag)[0].childNodes.length;
		while ( c < numResults ) {
			row = xml.getElementsByTagName(recordTag)[c];
			id = xml.getElementsByTagName(recordTag)[c].getAttribute(recid);
			mid = xml.getElementsByTagName(recordTag)[c].getAttribute(modid);
			result.push ( newObject ( row , fieldObjects , id , mid ) ) ;
			c++;	
		};		
		return result ;

};

//creates a general -findquery URL for postQueryFMS
//each object represtents a find request
//add -omit:1 to the object to make omit request
function findRecordsURL( fileName , layoutName , requests , sort , max , skip ){
	
	//function for building sort string, trturns "" if sort not specified.
	var addSortURL =  function ( sortObject ){
		if (!sortObject){return ""};
		var fields = Object.keys(sortObject);
		var f = 0;
		var fq = fields.length;
		var i = 0 ;
		var fnp = "";
		var fbo = "";
		var thisField = "";
		var thisOrder = "";
		var txt = "";
		for (f in fields){
			i = Number(f) + Number(1);
			fnp = "field" + i ;
			fbo = "order" + i ;
			thisField = sortObject[fnp];
			thisOrder = sortObject[fbo];
			if (!thisField){
			return txt;
			}
			else {
			if (!thisOrder){thisOrder = "ascend"};
			txt += "&-sortfield." + i + "=" + thisField + "&-sortorder." + i + "=" + thisOrder ;
			};
		};
		return txt;
	};
	
	var srt = addSortURL (sort);
	
	//max and skip
	if(max){
		var mx = "&-max=" + max;
	}
	else
	{var mx = "";
	};
	if(skip){
		var sk = "&-skip=" + skip;
	}
	else
	{var sk = "";
	};


	
	//build simple fild all query if none specified and done.
	if (!requests){ return "-db=" + fileName + "&-lay=" + layoutName + srt + "&-findall" };
	var c = 0 ;
	var r = 0 ;
	var ff = 0 ;
	var thisRequest = {};
	var requestFields = [];
	var qa = "" ;
	var qan = "" ;
	var thisField = "";
	var thisValue = "";
	var omitProp = "-omit"
	//build OR clauses (requests) for each object
	for ( r in requests ){
		thisRequest = requests[r];
		requestFields = Object.keys(thisRequest);
		if (r==0){qan+="&-query=("} else {qan+=";("}
		//build and clases (specfiy fields and criteria) for this object (request).
		for (ff in requestFields){
			thisField = requestFields[ff];
			if(thisField===omitProp){
				//omit this request by inserting ! into qan in front of last (.
				//and don't include this property as a field search.
				var i = qan.lastIndexOf("(");
				qan = qan.substr(0,i)+"!"+qan.substr(i);				
			}
			else {
				//regular request, write as is
			thisValue = thisRequest[thisField];
			c ++ ;
			qa += "&-q"+c+"="+thisField+"&-q"+c+".value="+thisValue ;
			if (ff==0){qan+="q"+c} else {qan+=",q"+c};
			};
		};		

		qan += ")"

	};
	qa += srt + sk + mx + "&-findquery";
	qan += qa
	//return "/fmi/xml/FMPXMLRESULT.xml?-db=" + fileName + "&-lay=" + layoutName + qan ;
	return "-db=" + fileName + "&-lay=" + layoutName + qan ;
};

//returns a general -edit URL for postQueryFMS from an object
//object properties need to correspond to
//leaving the record id property (fmxjRecId) blank indicates a new record
function editRecordURL( fileName , layoutName , editObj ){
	
	var f = 0 ;
	var q = "";
	var recid = "-recid";
	var thisField = "";
	var fieldNames = Object.keys ( editObj ) ;
	var recid = editObj [recid];
	//if we have a record id then we edit the specified record.
	//if no record id is passed, then we create a new record.
	if (!recid)
		{
		var tag = "&-new"
		} 
		else {
		var tag = "&-edit";
		};
	for ( f in fieldNames ){
		thisField = fieldNames[f];
		q += "&" + thisField + "=" + editObj[thisField];
	};
	q = q + tag ;
	return "-db=" + fileName + "&-lay=" + layoutName + q ;
};

//creates a general -delete URL for postQueryFMS
function deleteRecordURL( fileName , layoutName , recid ){
	var q = "&-recid=" + recid + "&-delete";
	return "-db=" + fileName + "&-lay=" + layoutName + q ;
};

//**********Javascript Object Array Functions

//Filter an Array of objects by property.
//returns a new object array based on filters
//each "filters" object represents an OR clause containing AND clauses, example:
//[{"Status":"Active","Resource":"Room A"},{"Status":"New","resource":"Room A"}]
//returns all objects where the resource is "Room A" and the status is "Active" or "New".
//specify data types as a single object: {"Status":"String"} unspecified properties will be treated as strings.
function filterObjects( filters , searchTypes , source ) {
	
	//if no filters applied, we can just return the source
	if(!filters){return source};
	
	//regExp logic is here: for string, use "begins with" by default.
			var generateRegEx = function ( v , dt ) {
		
				var re = new RegExp();
				if (dt.toUpperCase() === "STARTSWITH") { 
					re = new RegExp ( "^" + v + "|\\s" + v , "mi" ) ;
				}
				else if (dt.toUpperCase() === "EQUALS") { 
					re = new RegExp ( "^" + v + "$" ) ;
				}
				else if (dt.toUpperCase() === "CONTAINS") { 
					re = new RegExp ( "\\" + v + "\\" , "mi" ) ;
				};
				return re;
			}; 
	
			var s = 0;
			var f = 0;
			var accept = 0;
			var numFilterFields = 0;
			var ff = 0;
	
			var thisFilterField = "";
			var thisFilterFieldValue = "";
			var thisObjectFieldValue = "";
			var thisFilterFieldType = "";
	
			var newObjectArray = [];
			var filterFields = [] ;
	
			var thisObject = {};
			var thisFilter = {};
	
			var thisRE = new RegExp();
			//loop through objects
			for ( s in source ) {
				thisObject = source[s];
				//loop through filters and test accordingly.
				for ( f in filters ) {
					accept = 0; 
					thisFilter = filters[f];
					filterFields = Object.keys ( thisFilter ) ; 
					numFilterFields = filterFields.length ;
					for ( ff in filterFields ){ 
						thisFilterField = filterFields[ff];
						thisFilterFieldValue = thisFilter[thisFilterField];
						thisObjectFieldValue = thisObject[thisFilterField];
						thisFilterFieldType = searchTypes[thisFilterField];
						if ( !thisFilterFieldType ) { 
							 thisFilterFieldType = "STARTSWITH" 
						 	};
						thisRE = generateRegEx ( thisFilterFieldValue , thisFilterFieldType );
						if ( thisRE.test ( thisObjectFieldValue)) { 
							accept ++ ; 
							};
						}; 
						//add to new object if all filter fields in the filter return true for our regExp
						if ( accept === numFilterFields ) { 
							newObjectArray.push(thisObject); 
							break; 
							} ; 
					}; 

				}; 
	
			return newObjectArray ;
};

//Sort an Array of objects by property.
//the "sortOrder" is a single object specifying properties, order and type
//{"property1":"StartDate","order1":"Ascend","type1":"date","property2":"Resource","order2":"Descend","type2":"string"}
//Supported types: String, Number, Date, Time
function sortObjects( sortOrder,  source ) {

			var convertDateString = function ( ds ) {var d = new Date(ds);return(Number(d));};
			var convertTimeString = function ( ts ) {
				var vals = ts.split(':');
				var v = 0;
				var thisVal = 0;
				var seconds = 0;
				for ( v in vals ){
					thisVal = Number ( vals[v].substr(0,2) );
					seconds += thisVal * Math.pow(60,2-v);
				}
				return seconds;
			};
						
			var scEvalSort = function ( s , t , dType , sOrder ){
						
				if ( dType.toUpperCase() === "STRING" ){
					if ( sOrder.toUpperCase() === "ASCEND" ) { 		
						if ( s < t ) { return -1 } else { return 1 } ;
						} 
					else { 							
						if ( s > t ) { return -1 } else { return 1 } ;
						};
					} 
				else if ( dType.toUpperCase() === "NUMBER" ) {
					if ( sOrder.toUpperCase() === "ASCEND" ) { 	
						 	return s - t }
						else {						
							return t - s } ;
					}
				else {
					return 0
				};
			}; 
	
			//var sortFields = Object.keys ( sortOrder ) ;
		
			source.sort ( function ( a , b ) {
	
				var result = 0;
				var sf = 0;
				var i = 0;
				
				var adp = "";
				var v = "";
				var p = "";
				var t = "";
				var ad = "";
	
		
				for ( sf in sortOrder ) {
					i++
					p = sortOrder["property"+i];
					ad = sortOrder["order"+i];
					t = sortOrder["type"+i];
					
					if (!t){t="STRING"};
							
					if (!a[p]) { var x = "" } else { var x = a[p] } ; 
					if (!b[p]) { var y = "" } else { var y = b[p] }; 

					
					//ignore case
					if ( t.toUpperCase() === "STRING" ) { 
						if ( x.length > 0 ) { var x = x.toUpperCase()} else { var x = "" }  ;
						if ( y.length > 0 ) { var y = y.toUpperCase()} else { var y = "" } ; 
					} ; 
						
					//convert dates to numbers for sort.
					if ( t.toUpperCase() === "DATE" ) {
						if ( x.length > 0 ) { x = convertDateString(x);} else { var x = "" }  ;
						if ( y.length > 0 ) { y = convertDateString(y);} else { var y = "" } ; 
						t = "NUMBER";
					} ;
					
					//convert dates to numbers for sort.
					if ( t.toUpperCase() === "TIME" ) {
						if ( x.length > 0 ) { x = convertTimeString(x);} else { var x = "" }  ;
						if ( y.length > 0 ) { y = convertTimeString(y);} else { var y = "" } ; 
						t = "NUMBER";
					} ;
			
					if ( x !== y ) { 
						result = sf ; 
						break; 
						}; 
					}; 
		
					if ( result === 0 ) { 
						return 0 ;
					}
					else { 
						if ( length.ad === 0 ) ad = "ASCEND"; 
						return scEvalSort ( x , y , t , ad ) ;  
					} ; 
				} 
			);
} ;

}())




