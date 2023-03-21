// -----JS CODE-----
/*
    Include this script at the top of the scene to enable global commands
    Usage:
      global.showProps(object)
      global.showScene(scene)
      global.showSceneObject(sceneObject)
      global.showComponent(component)
      
    Original by @robertlugg
    https://gist.github.com/robertlugg/a5161200998092ddf69cb7393f7efcc0
*/

function showProps(obj, pre) {
  pre = pre || ''
	var result = ''
	result += pre + "Properties\n"
  for (var i in obj) {
        if(i == "name") {
            result = obj[i]
        }
    }
	return result
}

//function showProps(obj, pre) {
//  pre = pre || ''
//	var result = ''
//	result += pre + "Properties\n"
//  for (var i in obj) {
//        if (obj.hasOwnProperty(i)) {
//          result += pre + '    .' + i + ' = ' + obj[i] + '\n'
//        }
//    }
//	result += pre + "Inherited Properties\n"
//  for (var i in obj) {
//        if (!obj.hasOwnProperty(i)) {
//          result += pre + '    .' + i + ' = ' + obj[i] + '\n'
//        }
//  }
//  print(result)
//	return result
//}

function showComponent(component, pre) {
  pre = pre || ''
  var out = ''
  out += pre + component.getTypeName() + "\n"
  out += showProps(component, pre + '    ')
  print(out)
  return out
}

function showSceneObject(obj, pre) {
  pre = pre || ''
  var out = ''
  out += pre + obj.name + " (" + obj.getTypeName() + ")\n"
  out += showProps(obj, pre + '    ')
  var componentCount = obj.getComponentCount('')
  if (componentCount) {
    out += pre + "    Components:\n"
    for(var i=0; i < componentCount; i++) {
      var thisComponent = obj.getComponentByIndex('', i)
      out += showComponent(thisComponent, pre + '        ')
    }
  }
  var childCount = obj.getChildrenCount()
  if (childCount) {
    out += pre + "    Children:\n"
    for(var i=0; i < childCount; i++) {
      var thisChild = obj.getChild(i)
      out += showSceneObject(thisChild, pre + '        ')
    }
  }
//  print(out)
  return out
}

function showScene(scene) {
  var out = '---\n'
  out += "core version: " + global.getCoreVersion().toString() + '\n'
  var childCount = scene.getRootObjectsCount()
  for(var i = 0; i < childCount; i++) {
    var obj = scene.getRootObject(i)
    out += showSceneObject(obj, '')
  }
  print(out)
  return out
}

var colliderName = "";
    function setColliderName(cName) {
    colliderName = cName;
}
function getColliderName() {
    return colliderName
}

global.showScene = showScene
global.showSceneObject = showSceneObject
global.showComponent = showComponent
global.showProps = showProps
global.setColliderName = setColliderName
global.getColliderName = getColliderName