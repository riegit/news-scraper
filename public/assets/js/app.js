function shownote(event) {
  event.preventDefault();
  var id = $(this).attr("value");
  $("#addnote")
    .fadeIn(300)
    .css("display", "flex");
  $("#add-note").attr("value", id);
  $.get("/" + id, function(data) {
    $("#article-title").text(data.title);
    $.get("/note/" + id, function(data) {
      if (data) {
        $("#note-body").val(data.body);
      }
    });
  });
}

function addnote(event) {
  event.preventDefault();
  var id = $(this).attr("value");
  var obj = {
    body: $("#note-body")
      .val()
      .trim()
  };
  $.post("/note/" + id, obj, function(data) {
    window.location.href = "/saved";
  });
}

function changestatus() {
  var status = $(this).attr("value");
  if (status === "Saved") {
    $(this).html("Unsave");
  }
}

function changeback() {
  $(this).html($(this).attr("value"));
}

$(document).on("click", ".addnote-button", shownote);
$(document).on("click", "#add-note", addnote);
$(".status").hover(changestatus, changeback);
