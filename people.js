var loop = 0;
var startIndex = 0;
var offset = 0;


function ProfileDetails(follower, vote, voteMe, voteHim, thankMe, thankHim, followed, followMe) {
    this.follower = follower;
    this.vote = vote;
    this.voteMe = voteMe;
    this.voteHim = voteHim;
    this.thankMe = thankMe;
    this.thankHim = thankHim;
    this.followed = followed;
    this.followMe = followMe;
}


var QuestionCrawler = {
 
  //url: 'http://www.zhihu.com/node/ProfileFollowersListV2',


  queryWeb: function() {
    var fd = new FormData();    
    fd.append( 'method', 'next' );
    fd.append( 'params', '{"offset":'+offset+',"order_by":"created","hash_id":"13ba78a859eaf6b9a5b27c5c56ee8419"}' );
    //fd.append( 'params', '{"offset":0,"order_by":"answer","hash_id":"13ba78a859eaf6b9a5b27c5c56ee8419"}' );
    fd.append( '_xsrf', '5c07cd5d764761c51f7b9782d9261baa' );

    var url = 'http://www.zhihu.com/node/ProfileFollowersListV2';
    var type = $("#followType").val();
    if(type == "followee")
      url = "http://www.zhihu.com/node/ProfileFolloweesListV2";

    var req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.onload = this.updateList.bind(this);
    req.send(fd);
  },

  updateList: function (e) {
    //console.log($("#zh").get(0).innerHTML);
    //var wrapper = $("#zh");
    //$("#zh").get(0).innerHTML=e.target.responseText;
    var res = $.parseJSON(e.target.responseText);
    //console.log(res.msg);
    //$("#zh").get(0).innerHTML=res.msg;
    $("#zh").append(res.msg);


    var ids = $("#zh .zm-item-link-avatar");
    //console.log(ids.length);
    for(var i=0; i<ids.length; i++)
    {
      QuestionCrawler.queryProfile($(ids[i]).attr("href").substring(8));
    }

  },


  queryProfile: function(profileId) {
    var req = new XMLHttpRequest();
    //console.log("http://www.zhihu.com/people/"+profileId);
    req.open("GET", "http://www.zhihu.com/people/"+profileId, true);
    req.onload = this.updateProfile.bind(this, profileId);
    req.send();
  },
  
  updateProfile: function (profileId, e) {

    //console.log(">>>>>>> profileid= "+ profileId);
    $("#profile").get(0).innerHTML=e.target.responseText;
    var voteNode = $("#profile .vote-thanks-relation");
    var peopleUrl = "http://www.zhihu.com/people/" + profileId;
    var peopleNode = $("#zh a[href='"+peopleUrl+"']").parent().parent();

    if(voteNode.length>0)
    {
      //console.log($("#profile .vote-thanks-relation").html());
      //console.log(peopleUrl);
      //console.log(peopleNode.html());
      peopleNode.append(voteNode);
      voteNode.css("float", "right");
    }

    this.postUpdate(peopleNode);
  },


  postUpdate: function (peopleNode) 
  {

      //offset++;
      offset++; 
      $("#offset").val(offset);

      var details = this.getProfileDetails(peopleNode);
      if(this.needHighLight(details))
      {
        $("#top").append(peopleNode.parent(".zm-profile-card")[0].outerHTML);
      }

      if(offset%20 == 0)
      {
        $("#follower").append($("#zh > div"));

        var batchSize = parseInt($("#batchSize").val());
        var max = startIndex+batchSize;
        if(offset<max)
        {
          console.log("Preparing for next query, offset: " + offset);
          setTimeout(this.queryWeb.bind(this), 2000);
        }
      }


  },


  getProfileDetails: function (peopleNode) 
  {
    var follower = parseInt(peopleNode.find("div.details > a[href$='followers']").text());
    var vote = parseInt(peopleNode.find("div.details > a:last").text());
    var voteHim = parseInt(peopleNode.find("div.vote-thanks-relation  a[href$='voted']").text());
    var voteMe = parseInt(peopleNode.find("div.vote-thanks-relation  a[href$='vote']").text());
    var thankHim = parseInt(peopleNode.find("div.vote-thanks-relation  a[href$='thanked']").text());
    var thankMe = parseInt(peopleNode.find("div.vote-thanks-relation  a[href$='thank']").text());
    var followed = peopleNode.parent(".zm-profile-card").find("button.zg-btn-unfollow").length;
    var followedMe = peopleNode.parent(".zm-profile-card").find("button.nth-0").length==0;
    /*
    console.log("1>>>>>>>>>"+peopleNode.find("div.details > a[href$='followers']").html());
    console.log("2>>>>>>>>>"+peopleNode.find("div.details > a").html());
    console.log("3>>>>>>>>>"+peopleNode.find("div.details").html());
    console.log("4>>>>>>>>>"+peopleNode.find(".details").html());
    console.log("5>>>>>>>>>"+peopleNode.html());*/
    console.log(">>>>>>>>> follower:"+follower + ", vote: " + vote
     + ", voteHim: " + voteHim + ", voteMe: " + voteMe + ", thankHim: " + thankHim + ", thankMe: " + thankMe + ", followed: " + followed);

    return new ProfileDetails(follower, vote, voteMe, voteHim, thankMe, thankHim, followed, followedMe);

  },

  needHighLight: function (details) 
  {
    var type = $("#followType").val();
    //followee that need highlight
    if(type == "followee")
    {
      //if(!details.followMe || details.voteMe<10 || details.follower<=10)
      if(details.voteMe<9 && details.follower<=500)
        return true;
      else
        return false;
    }
    //followers that need highlight
    else
    {
      if(details.followed || !details.voteMe)
        return false;

      if(details.vote >= 10000 || details.follower >= 5000)
        return true;
      
      var v = 0;
      if(details.voteMe)
        v += details.voteMe;
      if(details.thankMe)
        v += details.thankMe/2;

      if(v > 8)
        return true;

      return false;
    }
  },


  startProcess: function()
  {
    startIndex = parseInt($("#offset").val());
    offset = parseInt($("#offset").val());

    this.queryWeb();
  },


};

document.addEventListener('DOMContentLoaded', function () {
  
  $("#test").click(function()
  {
    QuestionCrawler.startProcess();
    //QuestionCrawler.queryWeb();
  });

});

/*
$("#topic_link").click(function(){
  chrome.tabs.create({url:chrome.extension.getURL("topics.html")});
});


*/

//var myVar=setInterval(function () {QuestionCrawler.queryWeb();}, 45000);
