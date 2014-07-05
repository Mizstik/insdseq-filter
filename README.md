insdseq-filter
==============
This is a Node command line utility for extracting gene information from an INSDSeq XML file.
The files used for the development of this tool were obtained from http://www.ncbi.nlm.nih.gov/nuccore
though any source should work as long as they follow the INSDSeq XML specification.

Installation
------------
```shell
git clone https://github.com/mizstik/insdseq-filter.git
npm install
```

This package requires xml-stream, which in turn requires node-expat, which requires compiling.
Therefore, you may run into problems related to compiling the modules during the installation.
See [this](https://github.com/TooTallNate/node-gyp#installation) page for a list of required components.

On Windows, it can be helpful to specify the version of Visual Studio that you have installed:

```shell
npm install --msvs_version=2012
```

This can be quite difficult on Windows, so as a last resort you may try downloading a zipped node_modules folder [here](http://mizstik.github.io/insdseq-filter.node_modules.zip).
(Windows 64-bit only)

Usage
-----
The program parses the INSDSeq XML input file, examining each locus for features that match specified gene or product names.
When a matching feature is found, it extracts the gene sequence as indicated by the position info and output this to a file.
Supported output formats are FASTA and CSV.

Running the tool without any argument will display a help text.

```shell
node insdseq-filter.js
```

At minimum, you need to specify an input file, which is the INSDSeq XML you want to parse.

```shell
node insdseq-filter.js --infile=input.xml
```

By default, the program will only look at CDS features and does not filter them for any gene or product name, outputting all
found CDS features to the output file which is output.fas by default.

To specify a different output file, use --outfile and --format:

```shell
node insdseq-filter.js --infile=input.xml --outfile=coii --format=csv
```

The extension of the output filename is determined by the format. In this example, the output file will be coii.csv.
Only 'fas' and 'csv' are supported.

To filter for a particular gene or product, use the --filter option:

```shell
node insdseq-filter.js --infile=input.xml --filter=coii
```

The above example writes down CDS features with /gene=coii or /product=coii in them. Note that the search is case-insensitive.

You can specify multiple names separated by comma:

```shell
node insdseq-filter.js --infile=input.xml --filter=coii,cox2,co2
```

Sometimes, gene or product names can have multiple dozens of synonyms. You can create a text file containing a list of
the synonyms (separated by newlines instead of comma) and specify this file with --filterfile option:

```shell
node insdseq-filter.js --infile=input.xml --filterfile=filter.txt
```

See examples folder for an example of the filter file. Note that due to differences among text editors and the OSes,
it is recommended that you leave an empty line at the beginning and at the end of the file. Empty lines are ignored.

To search on features other than CDS, use the --feature option. This is also case-insensitive and can be provided
in a list of comma-separated values:

```shell
node insdseq-filter.js --infile=input.xml --feature=tRNA,gap
```

Or use 'all' to run on all features:

```shell
node insdseq-filter.js --infile=input.xml --feature=all
```

An example using multiple options:

```shell
node insdseq-filter.js --infile=input.xml --feature=CDS --filter=coii,cox2,co2 --outfile=coii --format=fas
```

enumerator.js
-------------
This tool lists all names under /gene= or /product= and counts how many species contain these genes in the XML.
By default it only searches CDS features. Output is always CSV.

```shell
node enumerator.js --infile=input.xml --outfile=output.csv --feature=CDS,tRNA
```

Like the filter script, you can specify features with comma-separated values or use 'all' to search through all features.


Misc
----
You can contact me on [github](https://github.com/Mizstik) or [twitter](https://twitter.com/Mizstik).

This tool was created for a friend of mine for his research project. It seems like this is
something someone somewhere out there might find useful, so I'm uploading it here.


License
-------
Copyright 2014 Thirasan Borisuthipandit
Licensed under the MIT License. (see [LICENSE](https://raw.githubusercontent.com/Mizstik/insdseq-filter/master/LICENSE))
