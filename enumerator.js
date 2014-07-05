"use strict";

var t_app = process.hrtime();
 
var        fs = require('fs'),
            _ = require('underscore'),
	     util = require('util'),
    xmlstream = require('xml-stream');
		 
var opt = require('minimist')(process.argv.slice(2));

var defaultarg = {
	infile : '',
	feature : 'CDS', // comma-separated, or 'all'
	outfile : 'output.csv'
};
_.defaults(opt, defaultarg);

if (opt.infile == '') {
	console.log("\n"+"INSDSEQ XML Gene Enumerator by Thirasan Borisuthipandit, \u00A9 2014 MIT LICENSE (see license.txt)");
	console.log("\n"+"BASIC USAGE: node enumerator.js --infile=filename.xml\n");
	console.log("Options:");
	console.log("\t--infile\tfilename of the input XML\n");
	console.log("\t--feature\tINSDFeature to filter, default --feature=CDS");
	console.log("\t\t\tUse 'all' to parse all features.\n");
	console.log("\t--outfile\tname of output file (extension determined by format)");
	console.log("\t\t\tdefault --outfile=output.csv");
	process.exit(0);
}

var all_feature = false;
if (opt.feature == 'all' || opt.feature == '') {
	all_feature = true;
} else {
	opt.feature = opt.feature.split(',');
	opt.feature = _.map(opt.feature, function (el) {return el.toUpperCase();});
}

var done = false;
var locus_count = 0;
var gene_ct = 0;
var unique_ct = 0;
var repo = {};

var outstream = fs.createWriteStream(opt.outfile, {'flags': 'w'});

var instream = fs.createReadStream(opt.infile);
var xml = new xmlstream(instream);
xml.collect('INSDFeature');
xml.collect('INSDQualifier');

var bytes_processed = 0;
xml.on('data', function (data) {
	bytes_processed += data.length;
});

xml.on('endElement: INSDSeq', function(seq) {
	locus_count++;
	util.print('Locus: '+locus_count+', Genes: '+gene_ct+', Unique pairs: '+unique_ct+', Bytes: '+(bytes_processed/1000).toFixed(0)+' KB'+"\u001B[0G");
	
	var sp_name = seq.INSDSeq_organism;
	var features = seq["INSDSeq_feature-table"].INSDFeature;
	
	_.each(features, function (feature) {
		if (opt.feature.indexOf(feature.INSDFeature_key.toUpperCase()) > -1 || all_feature) {
			_.each(feature.INSDFeature_quals.INSDQualifier, function (qualifier) {
				var gene_name = '';
				if (qualifier.INSDQualifier_name == 'gene' || qualifier.INSDQualifier_name == 'product') {
					gene_name = qualifier.INSDQualifier_value;
					
					if (typeof repo[gene_name] == 'undefined') {
						repo[gene_name] = [];
						repo[gene_name].push(sp_name);
						gene_ct++;
						unique_ct++;
					} else {
						if (repo[gene_name].indexOf(sp_name) == -1) {
							repo[gene_name].push(sp_name);
							unique_ct++;
						}
					}
				}
			});
		}
	});
});

xml.on('end', function () {
	outstream.write("sep=\t\n");
	outstream.write("Gene/Product\tSpecies Count\n");
	_.each(repo, function (val,key) {
		outstream.write(key+"\t"+val.length+"\n");
	});
});


process.on('exit', function () {
	t_app = process.hrtime(t_app);
	var timetext = (t_app[0] + t_app[1]/1000000000).toFixed(2) + ' seconds';
	console.log("\n"+'Time used: '+timetext);
});
