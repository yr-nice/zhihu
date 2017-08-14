var all = {};
var hide = {};
var tempHide = {};
var readed = {};
var options = {};
var maxLen = 1200;
var housekeepingLen = 500;

var loop = 0;

chrome.storage.local.get('hide', function (result) {
    if(result.hide != undefined)
      hide = result.hide;
    console.log("Hidden ID Cache Size : "+JSON.stringify(hide).length/1024+"K");
});



function question(id, answerNum, content, disabled, popularity) {
    this.id = id;
    this.answerNum = answerNum;
    this.content = content;
    this.disabled = disabled;
    this.popularity = popularity;
    this.lastUpdateLoop = loop;
    this.tag="";
}

var QuestionCrawler = {
 
  url: 'http://www.zhihu.com/topic',


  queryWeb: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.url, true);
    req.onload = this.updateList.bind(this);
    req.send(null);
  },



  updateList: function (e) {
    //console.log($("#zh").get(0).innerHTML);
    $("#zh").get(0).innerHTML=e.target.responseText;
    var questions = $("div.topic-feed-item a");
    //console.log(questions.length);

    var output = $("#now");
    //$(output).prepend("<br><br>")
    //$(output).html("");
    $(".hl").removeClass("hl");
    for(var i=0; i<questions.length; i++)
    {
      var q = questions.get(i);
      //console.log(q);
      var qid = $(q).attr("href").substr(10);
      var str = $(q).text();
      var tag = $(q).parent().parent().parent().find(".topic-item-title-link").text();
      var tagId = $(q).parent().parent().parent().find(".topic-item-title-link").attr("href").substr(7);
      //console.log(str + " "+ qid + " " + tag);
      var obj = all[qid];
      options[tag] = tagId;
      if(obj == null || obj == undefined )
      {
        obj = new question(qid, 0, str, false, 1);
        obj.tag = tag;
        all[qid] = obj;
        this.appendQuestion(obj);
      }
      else
      {
        //obj.answerNum = answerCount;
        if((","+obj.tag).indexOf(","+tag)==-1)
          obj.tag += "," +tag;
        obj.popularity++;
        obj.lastUpdateLoop = loop;
        this.updateQuestion(obj);
      }
  
    }

    this.updateOptions();
    this.updateTop();
    this.housekeeping();

    $(".hide_show").click(function(){
      //alert($(this).parent().attr("id"));
      var id = $(this).parent().attr("id");

      if(!hide[id])
      {
        hide[id] = true;
        chrome.storage.local.set({'hide': hide});       
        $(this).parent().css('display', 'none');
        $("#t_"+id).css('display', 'none');
      }

    })

    $(".temp_hide").click(function(){
        var id = $(this).parent().attr("id");
        tempHide[id]=true;
        $(this).parent().css('display', 'none');
        $("#t_"+id).css('display', 'none');

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

  updateOptions: function(o)
  {
    var arr = [];
    var i = 0;
    for(var k in options)
    {
      arr[i++] = k;
    }

    arr.sort();

    $("#select_tag").html("<option value='all'>All</option>");

    for(var i=0; i<arr.length; i++)
    {
      var o = arr[i];
      if(o.answerNum>5000 || hide[o.id] || tempHide[o.id])
      {
        //$(output).append("<div style='display: none;'> <a href='http://www.zhihu.com/question/"+o.id+"' >"+o.answerNum + " " + o.content+ " " + o.popularity + " </a> </div>");
      }
      else
        $("#select_tag").append("<option value='" + arr[i] + "'>" + arr[i] + "</option>");
    }

    $("#select_tag").change(function(){
        var tag = $(this).val();
        if(tag == "all")
          $(".question").removeClass("hidden_element");
        else
        {
          for(var k in all)
            if(all[k].tag.indexOf(tag)!=-1)
              $("#"+all[k].id).removeClass("hidden_element");
            else
              $("#"+all[k].id).addClass("hidden_element");

        }

      })

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
        var tagArr = o.tag.split(",");
        var tagLinks = "";
        var linkClass = 'question_link hl';
        if(readed[o.id])
          linkClass = "readed";
        for(var j=0; j<tagArr.length; j++)
          tagLinks += "<a href='http://www.zhihu.com/topic/" + options[tagArr[j]] + "'>" + tagArr[j]+ "</a>,";

        $("#top").append("<div class='question' id='t_"+o.id+"'><a href='javascript:void(0)' class='top_hide_show'>[X]</a> "
         + "<a href='javascript:void(0)' class='temp_hide'>[" + o.popularity + "]</a>"
         + "[" + tagLinks + "]"
         + " <a class='"+linkClass+"' href='http://www.zhihu.com/question/"+o.id+"' >" + o.content+"</a> </div>");
      }
    }

    $(".top_hide_show").click(function(){
      //alert($(this).parent().attr("id"));
      var id = $(this).parent().attr("id").substr(2);

      hide[id] = true;
      chrome.storage.local.set({'hide': hide});       

      $(this).parent().css('display', 'none');
      $("#"+id).css('display', 'none');
    })


  },
  clearTop: function()
  {
    $(".top_hide_show").click();
  },
  appendQuestion: function(o)
  {
      var output = $("#now");
      if(o.answerNum>5000 || hide[o.id] || tempHide[o.id])
      {
        //$(output).append("<div style='display: none;'> <a href='http://www.zhihu.com/question/"+o.id+"' >"+o.answerNum + " " + o.content+ " " + o.popularity + " </a> </div>");
      }
      else
        $(output).append("<div class='question' id='"+o.id+"'><a href='javascript:void(0)' class='hide_show'>[X]</a>"
         + "<a href='javascript:void(0)' class='temp_hide'>[" + o.popularity + "]</a>"
         + "<a href='javascript:void(0)' class='tag'>[" + o.tag + "]</a> "
         + " <a class='question_link hl' href='http://www.zhihu.com/question/"+o.id+"' >" + o.content+"</a> </div>");

  },

  updateQuestion: function(o)
  {
    $("#"+o.id).find(".question_link").addClass("hl");
    $("#"+o.id).find(".temp_hide").text("["+o.popularity+"]");
    $("#"+o.id).find(".tag").text("["+o.tag+"]");
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


};

document.addEventListener('DOMContentLoaded', function () {
  console.log("Hello, world!");
  QuestionCrawler.queryWeb();

  $("#clear_top").click(function()
  {
    QuestionCrawler.clearTop();
  });

});



var myVar=setInterval(function () {QuestionCrawler.queryWeb();}, 20000);
