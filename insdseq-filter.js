"use strict";

var t_app = process.hrtime();
 
var        fs = require('fs'),
            _ = require('underscore'),
	     util = require('util'),
    xmlstream = require('xml-stream');
		 
var opt = require('minimist')(process.argv.slice(2));

function chunkify (instring, chunklen) {
	if (typeof instring != 'string') return false;
	if (typeof chunklen == 'undefined') chunklen = 70;
	var output = [];
	while (instring) {
		if (instring.length < chunklen) {
			output.push(instring);
			break;
		} else {
			output.push(instring.substr(0, chunklen));
			instring = instring.substr(chunklen);
		}
	}
	return output;
}

var defaultarg = {
	infile : '',
	feature : 'CDS', // comma-separated, or 'all'
	// filter : 'coii,cox2', // comma-separated
	// filterfile : 'filter.txt',
	outfile : 'output',
	format : 'fas' // or csv
};
_.defaults(opt, defaultarg);

if (opt.infile == '') {
	console.log("\n"+"INSDSEQ XML Gene Filter by Thirasan Borisuthipandit, \u00A9 2014 MIT LICENSE (see license.txt)");
	console.log("\n"+"BASIC USAGE: node insdseq-gene-filter.js --infile=filename.xml --filter=genename\n");
	console.log("Options:");
	console.log("\t--infile\tfilename of the input XML\n");
	console.log("\t--feature\tINSDFeature to filter, default --feature=CDS\n");
	console.log("\t--filter\tcomma-separated list of genes, e.g. --filter=coii,cox2");
	console.log("\t\t\tIf filter is not specified, the script will return all genes.\n");
	console.log("\t--filterfile\tfilename containing filters, e.g. --filter=filter.txt\n");
	console.log("\t--outfile\tname of output file (extension determined by format)");
	console.log("\t\t\tdefault --outfile=output");
	console.log("\t--format\tfas or csv, default --format=fas\n");
	process.exit(0);
}

if (opt.format != 'fas' && opt.format != 'csv') {
	console.log('Invalid output format. (support fas or csv)');
	process.exit(1);
}

var no_filter = false;
var filters = [];
if (opt.filter) {
	filters = opt.filter.split(',');
} else if (opt.filterfile) {
	var filterraw = fs.readFileSync(opt.filterfile, {encoding:'utf8'});
	filters = filterraw.split("\r\n");
	filters = filters.filter(function(n){ return n != '' });
} else {
	no_filter = true;
}
filters = _.map(filters, function (el) {return el.toUpperCase();});

var all_feature = false;
if (opt.feature == 'all' || opt.feature == '') {
	all_feature = true;
} else {
	opt.feature = opt.feature.split(',');
	opt.feature = _.map(opt.feature, function (el) {return el.toUpperCase();});
}


var done = false;
var locus_count = 0;
var locus_matched = 0;

var outputFilename = opt.outfile + '.' + opt.format;
var outstream = fs.createWriteStream(outputFilename, {'flags': 'w'});

if (opt.format == 'csv') {
	outstream.write("sep=\t\n");
	outstream.write("Locus\tDefinition\tOrganism\tFeature\tGene\tProduct\tFrom\tTo\tLength\tSequence\n");
}

var instream = fs.createReadStream(opt.infile);
var xml = new xmlstream(instream);
xml.collect('INSDFeature');
xml.collect('INSDQualifier');

xml.on('endElement: INSDSeq', function(seq) {
	locus_count++;
	util.print('Processing locus: '+locus_count+', matched features: '+locus_matched+"\u001B[0G");
	
	var entry = {};
	
	var features = seq["INSDSeq_feature-table"].INSDFeature;
	
	_.each(features, function (feature) {
		if (opt.feature.indexOf(feature.INSDFeature_key.toUpperCase()) > -1 || all_feature) {
			var gene = '';
			var product = '';
			
			_.each(feature.INSDFeature_quals.INSDQualifier, function (qualifier) {
				if (qualifier.INSDQualifier_name == 'gene') gene = qualifier.INSDQualifier_value;
				if (qualifier.INSDQualifier_name == 'product') product = qualifier.INSDQualifier_value;
			});
			
			if ((filters.indexOf(gene.toUpperCase()) > -1) || (filters.indexOf(product.toUpperCase()) > -1) || no_filter) {
				locus_matched++;
				
				entry.locus = seq.INSDSeq_locus;
				entry.definition = seq.INSDSeq_definition;
				entry.organism = seq.INSDSeq_organism;
				entry.feature = feature.INSDFeature_key;
				entry.from = feature.INSDFeature_intervals.INSDInterval.INSDInterval_from;
				entry.to = feature.INSDFeature_intervals.INSDInterval.INSDInterval_to;
				entry.size = entry.to - entry.from + 1;
				entry.sequence = seq.INSDSeq_sequence.substring(entry.from - 1, entry.to);
				
				entry.gene = gene;
				entry.product = product;
				
				if (typeof entry.gene == 'undefined') entry.gene = '';
				if (typeof entry.product == 'undefined') entry.product = '';
				
				if (opt.format == 'csv') {
					var csv = '"' + entry.locus + '"' + "\t"
					+ '"' + entry.definition + '"' + "\t"
					+ '"' + entry.organism + '"' + "\t"
					+ '"' + entry.feature + '"' + "\t"
					+ '"' + entry.gene + '"' + "\t"
					+ '"' + entry.product + '"' + "\t"
					+ '"' + entry.from + '"' + "\t"
					+ '"' + entry.to + '"' + "\t"
					+ '"' + entry.size + '"' + "\t"
					+ '"' + entry.sequence + '"' + "\n";
					
					outstream.write(csv);
					
				} else if (opt.format == 'fas') {
					var fas = '>'+entry.locus+' '+entry.organism+' '+entry.feature+' '+entry.gene+' '+entry.product+"\n";
					var seqchunk = chunkify(entry.sequence, 70);
					fas += seqchunk.join("\n") + "\n\n";
					
					outstream.write(fas);
				}
			}
		}
	});
	
});

process.on('exit', function () {
	t_app = process.hrtime(t_app);
	var timetext = (t_app[0] + t_app[1]/1000000000).toFixed(2) + ' seconds';
	console.log("\n"+'Time used: '+timetext);
	console.log('Locus processed: '+locus_count);
	console.log('Features matched: '+locus_matched);
});
