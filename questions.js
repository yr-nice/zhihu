var all = {};
var hide = {};
var readed = {};
var tempHide = {};
var maxLen = 1000;
var housekeepingLen = 400;

var loop = 0;

chrome.storage.local.get('hide_question', function (result) {
    if(result.hide_question != undefined)
      hide = result.hide_question;
    console.log("Hidden ID Cache Size : "+JSON.stringify(hide).length/1024+"K");
});



function question(id, answerNum, content, disabled, popularity) {
    this.id = id;
    this.answerNum = answerNum;
    this.content = content;
    this.disabled = disabled;
    this.popularity = popularity;
    this.lastUpdateLoop = loop;
}

var QuestionCrawler = {
 
  url: 'http://www.zhihu.com/topic/19776749/newest',


  queryWeb: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.url, true);
    req.onload = this.updateList.bind(this);
    req.send(null);
  },



  updateList: function (e) {
    //console.log($("#zh").get(0).innerHTML);
    //var wrapper = $("#zh");
    $("#zh").get(0).innerHTML=e.target.responseText;
    //$("meta").each(function(){console.log($(this).text);});
    var questions = $("div[itemprop='question']");
    //console.log(questions.length);

    var output = $("#now");
    //$(output).prepend("<br><br>")
    //$(output).html("");
    $(".hl").removeClass("hl");
    for(var i=0; i<questions.length; i++)
    {
      var q = questions.get(i);
      //console.log(q);
      var answerCount = $(q).find("meta[itemprop='answerCount']").attr("content");
      var qid = $(q).find("a.question_link").attr("href").substr(10);
      var str = $(q).find("a.question_link").text();
      //console.log(answerCount + " " + str + " "+ qid);
      var obj = all[qid];
      if(obj == null || obj == undefined )
      {
        obj = new question(qid, answerCount, str, false, 1);
        all[qid] = obj;
        this.appendQuestion(obj);
      }
      else
      {
        obj.answerNum = answerCount;
        obj.popularity++;
        obj.lastUpdateLoop = loop;
        this.updateQuestion(obj);
      }
  
    }
    this.updateTop();
    this.housekeeping();
/*
    var arr = [];
    var i = 0;
    for(var k in all)
    {
      arr[i++] = all[k];
    }

    arr.sort(function(a, b){

      var pa = a.popularity + (loop==a.lastUpdateLoop? 1000:0);
      var pb = b.popularity + (loop==b.lastUpdateLoop? 1000:0);

      return pb-pa;}
      );

    for(var i=0; i<arr.length; i++)
    {
      var o = arr[i];
      var hot = o.popularity - (loop - o.lastUpdateLoop) + 10;
      if(o.answerNum>5000 || hide[o.id] || tempHide[o.id] || hot<0)
      {
        //$(output).append("<div style='display: none;'> <a href='http://www.zhihu.com/question/"+o.id+"' >"+o.answerNum + " " + o.content+ " " + o.popularity + " </a> </div>");
      }
      else
        $(output).append("<div class='question' id='"+o.id+"'><a href='#' class='hide_show'>[X]</a> <a href='#' class='temp_hide'>[" + o.popularity + "]</a> <a href='http://www.zhihu.com/question/"+o.id+"' >[ "+o.answerNum + " ] " + o.content+"</a> </div>");

      if(i==questions.length-1)
        $(output).append("<div id='"+o.id+"'> <a href='#' >----------------------------------------------------------------</a></div>");

    }
*/
    $(".hide_show").click(function(){
      //alert($(this).parent().attr("id"));
      var id = $(this).parent().attr("id");

      if(!hide[id])
      {
        hide[id] = true;
        $(this).parent().css('display', 'none');
        chrome.storage.local.set({'hide_question': hide});       
      }

    })

    $(".temp_hide").click(function(){
        $(this).parent().css('display', 'none');
        tempHide[$(this).parent().attr("id")]=true;

    })

    $(".question_link").mouseleave(function(){
      var url = $(this).attr("href");
      var id = $(this).parent().attr("id");
      if(id.substr(0,2) == "t_")
        id = id.substr(2);

      $("[href='"+url+"']").addClass('readed');
      readed[id] = true;

        //$(this).addClass('readed');
    })

    $(".question_link").mouseenter(function(){
        var url = $(this).attr("href");
        $("[href='"+url+"']").removeClass('readed');

        //$(this).removeClass('readed');
    })

    loop++;
  },

  appendQuestion: function(o)
  {
      var output = $("#now");
      if(o.answerNum>5000 || hide[o.id] || tempHide[o.id])
      {
        //$(output).append("<div style='display: none;'> <a href='http://www.zhihu.com/question/"+o.id+"' >"+o.answerNum + " " + o.content+ " " + o.popularity + " </a> </div>");
      }
      else
        $(output).append("<div class='question' id='"+o.id+"'><a href='javascript:void(0)' class='hide_show'>[X]</a> <a href='javascript:void(0)' class='temp_hide'>[" 
          + o.popularity + "]</a> <a class='question_link hl' href='http://www.zhihu.com/question/"+o.id+"' >[ "+o.answerNum + " ] " + o.content+"</a> </div>");

  },

  updateQuestion: function(o)
  {
    $("#"+o.id).find(".question_link").addClass("hl");
    $("#"+o.id).find(".temp_hide").text("["+o.popularity+"]");
  },

  housekeeping: function()
  {
    var list = $("#now .question").click();
    console.log("questions : "+list.length);
    if(list.length>maxLen)
    {
      for(var i=0; i<housekeepingLen; i++)
      {
        var o = list[i];
        //console.log("questions : "+o.id);
        delete all[o.id];
        o.remove();
      }

    }
  },

  clearTop: function()
  {
    $(".top_hide_show").click();
  },

  updateTop: function(o)
  {
    var arr = [];
    var i = 0;
    for(var k in all)
    {
      if(!hide[k] && !tempHide[k])
        arr[i++] = all[k];
    }

    arr.sort(function(a, b){

      var pa = a.popularity
      var pb = b.popularity

      return pb-pa;}
      );

    $("#top").html("");
    for(var i=0; i<20&&i<arr.length; i++)
    {
      var o = arr[i];
      if(hide[o.id] || tempHide[o.id])
      {
        //$(output).append("<div style='display: none;'> <a href='http://www.zhihu.com/question/"+o.id+"' >"+o.answerNum + " " + o.content+ " " + o.popularity + " </a> </div>");
      }
      else
      {
        var linkClass = 'question_link hl';
        if(readed[o.id])
          linkClass = "readed";
        $("#top").append("<div class='question' id='t_"+o.id+"'><a href='javascript:void(0)' class='top_hide_show'>[X]</a> "
         + "<a href='javascript:void(0)' class='temp_hide'>[" + o.popularity + "]</a>"
         + " <a class='"+linkClass+"' href='http://www.zhihu.com/question/"+o.id+"' >[ "+o.answerNum + " ] " + o.content+"</a> </div>");
      }
    }

    $(".top_hide_show").click(function(){
      //alert($(this).parent().attr("id"));
      var id = $(this).parent().attr("id").substr(2);

      hide[id] = true;
      chrome.storage.local.set({'hide_question': hide});       

      $(this).parent().css('display', 'none');
      $("#"+id).css('display', 'none');
    })


  },
};

document.addEventListener('DOMContentLoaded', function () {
  console.log("Hello, world!");
  QuestionCrawler.queryWeb();
  //setTimeout(function () {QuestionCrawler.queryWeb();}, 5000);
  
  $("#clear_top").click(function()
  {
    QuestionCrawler.clearTop();
  });

  $("#test").click(function()
  {
    QuestionCrawler.housekeeping();
  });

});

/*
$("#topic_link").click(function(){
  chrome.tabs.create({url:chrome.extension.getURL("topics.html")});
});


*/

var myVar=setInterval(function () {QuestionCrawler.queryWeb();}, 45000);
