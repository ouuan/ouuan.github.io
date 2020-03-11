summaryInclude = 80;
var fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.1,
  tokenize:true,
  location: 0,
  distance: 100000,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    {name:"title",weight:0.9},
    {name:"contents",weight:0.8},
    {name:"tags",weight:0.5},
    {name:"categories",weight:0.3}
  ]
};

function executeSearch(){
  $('#search-results').html('正在搜索中...');
  searchContent = $('#search-content')[0].value;
  if (searchContent){
    $.getJSON( "/index.json", function( data ) {
      var pages = data;
      var fuse = new Fuse(pages, fuseOptions);
      var result = fuse.search(searchContent);
      if(result.length > 0){
        populateResults(result, searchContent);
      }else{
        $('#search-results').html("<p>没有找到您想要的结果。要不试试缩短关键词？</p>");
      }
    });
  } else {
    $('#search-results').html("<p>请在上方输入关键词进行搜索</p>");
  }
}

function populateResults(result, searchContent){
  $('#search-results').html('');
  $.each(result,function(key,value){
    var contents= value.item.contents;
    var snippet = "";
    var snippetHighlights = [searchContent];

    var s1 = contents.toLocaleLowerCase();
    var s2 = searchContent.toLocaleLowerCase();
    var pos = s1.indexOf(s2);
    if (pos != -1) {
      start = pos - summaryInclude;
      end = pos + searchContent.length + summaryInclude;
      if (start < 0) start = 0;
      if (end > contents.length) end = contents.length;
      snippet = contents.substring(start, end);
    }

    $.each(value.matches,function(matchKey,mvalue) {
      start = mvalue.indices[0][0] - summaryInclude;
      end = mvalue.indices[0][1] + summaryInclude + 1;
      if (start < 0) start = 0;
      if (end > mvalue.value.length) end = mvalue.value.length;
      if (pos == -1 && mvalue.key == "contents") {
        snippet += mvalue.value.substring(start,end);
      }
      snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0],mvalue.indices[0][1] + 1));
    });

    if(snippet.length<1){
      snippet += contents.substring(0,summaryInclude*2);
    }
    //pull template from hugo templarte definition
    var templateDefinition = $('#search-result-template').html();
    //replace values
    var output = render(templateDefinition,{key:key,title:value.item.title,link:value.item.permalink,tags:value.item.tags,categories:value.item.categories,snippet:snippet, date:value.item.date.split('T')[0]});

    $('#search-results').append(output);

    $.each(snippetHighlights,function(snipkey,snipvalue){
      new Mark(document.getElementById("summary-" + key)).mark(snipvalue);
    });
  });
}

function param(name) {
    return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function render(templateString, data) {
  var conditionalMatches,conditionalPattern,copy;
  conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
  //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
  copy = templateString;
  while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
    if(data[conditionalMatches[1]]){
      //valid key, remove conditionals, leave contents.
      copy = copy.replace(conditionalMatches[0],conditionalMatches[2]);
    }else{
      //not valid, remove entire section
      copy = copy.replace(conditionalMatches[0],'');
    }
  }
  templateString = copy;
  //now any conditionals removed we can do simple substitution

  if (data.tags) {
    var tagsHtml = '<footer class="post-footer"><div class="post-tags">';
    for (var i = 0; i < data.tags.length; ++i) {
      tagsHtml += '<a href="/tags/' + data.tags[i] + '">' + data.tags[i] + '</a>';
    }
    tagsHtml += '</div></footer>';
    data.tags = tagsHtml;
  }

  var key, find, re;
  for (key in data) {
    find = '\\$\\{\\s*' + key + '\\s*\\}';
    re = new RegExp(find, 'g');
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
}
